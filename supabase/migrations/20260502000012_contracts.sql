-- ============================================================================
-- 20260502000012_contracts
-- Contracts: uno por caso (puede haber addendums futuros).
-- terms_snapshot es inmutable post-firma para audit trail.
-- ============================================================================

create sequence if not exists public.contract_number_seq;

create or replace function public.generate_contract_number()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  select nextval('public.contract_number_seq') into next_num;
  return 'CTR-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 6, '0');
end;
$$;

create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  contract_number text unique not null default public.generate_contract_number(),
  template_version text not null default 'v1.0-2026-05-02',
  pdf_storage_path text,
  terms_snapshot jsonb not null,
  dropbox_sign_request_id text,
  signature_status text not null default 'draft' check (signature_status in (
    'draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled'
  )),
  signed_at timestamptz,
  signed_pdf_storage_path text,
  signature_audit_trail jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contracts_case on public.contracts(case_id);
create index idx_contracts_status on public.contracts(signature_status);
create index idx_contracts_dropbox on public.contracts(dropbox_sign_request_id)
  where dropbox_sign_request_id is not null;

create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.touch_updated_at();

alter table public.contracts enable row level security;

create policy "contracts: self read"
  on public.contracts for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "contracts: admin write"
  on public.contracts for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- INSERT/UPDATE de signature_status solo via service-role (server) cuando llega
-- el webhook de Dropbox Sign.
