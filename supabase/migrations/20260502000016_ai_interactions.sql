-- ============================================================================
-- 20260502000016_ai_interactions
-- Audit completo de interacciones IA (REQUERIMIENTOS §8.1, §11.4 capa 5).
-- Append-only — auditor del Innovation Office puede pedir muestra aleatoria.
-- ============================================================================

create table public.ai_interactions (
  id bigserial primary key,
  user_id uuid references public.profiles(id),
  case_id uuid references public.cases(id),
  model text not null,
  task_type text not null check (task_type in (
    'chat', 'extract_document', 'classify_intent', 'classify_output', 'other'
  )),
  prompt_tokens int,
  completion_tokens int,
  user_message text,
  ai_response text,
  function_call_name text,
  function_call_arguments jsonb,
  guardrails_triggered text[] not null default '{}',
  blocked boolean not null default false,
  block_reason text,
  user_flagged_inappropriate boolean not null default false,
  user_flagged_at timestamptz,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index idx_ai_interactions_user on public.ai_interactions(user_id, created_at desc);
create index idx_ai_interactions_case on public.ai_interactions(case_id) where case_id is not null;
create index idx_ai_interactions_blocked on public.ai_interactions(created_at desc) where blocked = true;
create index idx_ai_interactions_flagged on public.ai_interactions(created_at desc) where user_flagged_inappropriate = true;

-- Append-only
create rule ai_interactions_no_update as on update to public.ai_interactions do instead nothing;
create rule ai_interactions_no_delete as on delete to public.ai_interactions do instead nothing;

revoke update, delete on public.ai_interactions from authenticated, anon;

alter table public.ai_interactions enable row level security;

-- Cliente puede leer las suyas, admin todas; INSERT solo via service-role
create policy "ai_interactions: self read"
  on public.ai_interactions for select to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

-- Endpoint para que el cliente flag-ee respuestas inadecuadas (UPDATE permitido vía RPC)
-- Por ahora solo via service-role server. Si exponemos flag al cliente, abrimos UPDATE
-- selectivo en futuro sprint.
