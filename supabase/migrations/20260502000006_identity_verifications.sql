-- ============================================================================
-- 20260502000006_identity_verifications
-- Verificación de residencia Utah manual:
--   1. Cliente sube driver license/state ID (frente y reverso) a Storage privado.
--   2. (Sprint 7) Gemini multimodal extrae datos automáticamente.
--   3. Cliente confirma/corrige datos extraídos.
--   4. Admin revisa documentos manualmente, aprueba o rechaza.
-- ============================================================================

create table public.identity_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted' check (status in (
    'submitted',           -- cliente subió documentos, esperando review
    'extracting',          -- (Sprint 7) Gemini extrayendo datos
    'awaiting_user_review',-- datos extraídos, cliente debe confirmar
    'pending_admin',       -- cliente confirmó, admin debe aprobar
    'approved',            -- admin aprobó, residency_verified=true
    'rejected'             -- admin rechazó (con razón)
  )),
  -- Documentos subidos (paths de Storage; bucket privado con RLS)
  document_front_path text,
  document_back_path text,
  document_proof_path text,                -- opcional: utility bill, lease, etc.
  -- Datos extraídos / confirmados por el cliente
  extracted_full_name text,
  extracted_date_of_birth date,
  extracted_address_street text,
  extracted_address_city text,
  extracted_address_state text,
  extracted_address_zip text,
  extracted_id_number_last4 text,          -- solo últimos 4 (PII minimization)
  extracted_id_state text,
  extracted_expiration_date date,
  client_confirmed_at timestamptz,
  -- Review admin
  admin_reviewed_by uuid references public.profiles(id),
  admin_reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_identity_verifications_user on public.identity_verifications(user_id);
create index idx_identity_verifications_status on public.identity_verifications(status)
  where status in ('pending_admin', 'submitted', 'awaiting_user_review');

create trigger trg_identity_verifications_updated_at
  before update on public.identity_verifications
  for each row execute function public.touch_updated_at();

alter table public.identity_verifications enable row level security;

create policy "identity_verifications: self read"
  on public.identity_verifications
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

create policy "identity_verifications: self insert"
  on public.identity_verifications
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "identity_verifications: self update before admin"
  on public.identity_verifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and status in ('submitted', 'awaiting_user_review')
  )
  with check (
    user_id = auth.uid()
    and status in ('submitted', 'awaiting_user_review', 'pending_admin')
  );

create policy "identity_verifications: admin all"
  on public.identity_verifications
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
