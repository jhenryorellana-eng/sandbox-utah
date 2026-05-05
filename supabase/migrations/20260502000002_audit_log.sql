-- ============================================================================
-- 20260502000002_audit_log
-- Append-only audit log (REQUERIMIENTOS §8.1, sandbox audit posture).
--
-- Defensa en profundidad:
--   1. RULES `do instead nothing` para UPDATE y DELETE (silencioso).
--   2. REVOKE de privilegios UPDATE/DELETE a authenticated y service_role.
--   3. CI script verifica que ambas RULES existen y los grants no están.
--
-- Solo se INSERTa via service-role key desde server (NO hay policy de INSERT
-- para authenticated). Las policies SELECT permiten al usuario ver lo propio
-- y al admin todo.
-- ============================================================================

create table public.audit_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  pii_accessed boolean not null default false,
  phase text not null default 'completed' check (phase in (
    'started', 'completed', 'blocked', 'failed'
  )),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_user_created on public.audit_log(user_id, created_at desc);
create index idx_audit_log_resource on public.audit_log(resource_type, resource_id);
create index idx_audit_log_action_phase on public.audit_log(action, phase);

-- ----------------------------------------------------------------------------
-- Append-only blindado (capa 1: RULES)
-- ----------------------------------------------------------------------------
create rule audit_log_no_update as on update to public.audit_log do instead nothing;
create rule audit_log_no_delete as on delete to public.audit_log do instead nothing;

-- ----------------------------------------------------------------------------
-- Defense in depth (capa 2: REVOKE de privilegios)
-- ----------------------------------------------------------------------------
revoke update, delete on public.audit_log from authenticated;
revoke update, delete on public.audit_log from anon;
-- service_role mantiene grants implícitos por ser el dueño efectivo, pero las
-- RULES siguen aplicando al ejecutar via PostgREST/cliente. Si se usa SQL crudo
-- desde Studio con service_role, las RULES bloquean el escape.

-- ----------------------------------------------------------------------------
-- Habilitar RLS (policies en 20260502000004)
-- ----------------------------------------------------------------------------
alter table public.audit_log enable row level security;
