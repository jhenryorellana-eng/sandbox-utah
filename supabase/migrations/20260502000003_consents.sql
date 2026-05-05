-- ============================================================================
-- 20260502000003_consents
-- Inmutable consent tracking (REQUERIMIENTOS §6.5).
--
-- Cada disclaimer aceptado se guarda con:
--   - consent_key (ej. 'not_a_law_firm')
--   - consent_version (versionado: si cambia el texto, version nueva → re-prompt)
--   - text_snapshot (texto exacto firmado por el usuario, byte-a-byte)
--   - locale, ip, user_agent (audit forense)
-- Nunca se actualizan ni se borran (RULES).
-- ============================================================================

create table public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_key text not null,
  consent_version text not null,
  text_snapshot text not null,
  locale text not null check (locale in ('es', 'en')),
  ip_address inet,
  user_agent text,
  accepted_at timestamptz not null default now(),
  unique (user_id, consent_key, consent_version)
);

create index idx_consents_user on public.consents(user_id);
create index idx_consents_key_version on public.consents(consent_key, consent_version);

-- ----------------------------------------------------------------------------
-- Inmutabilidad (RULES)
-- ----------------------------------------------------------------------------
create rule consents_no_update as on update to public.consents do instead nothing;
create rule consents_no_delete as on delete to public.consents do instead nothing;

revoke update, delete on public.consents from authenticated;
revoke update, delete on public.consents from anon;

alter table public.consents enable row level security;
