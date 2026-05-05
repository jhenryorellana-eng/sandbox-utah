-- ============================================================================
-- 20260502000011_cases
-- Cases (instancia de un servicio para un cliente).
-- Soporta multi-casos por cliente, beneficiarios opcionales, state machine
-- de intake_status (validada en application layer).
-- ============================================================================

-- Sequence para case_number legible: USLP-2026-NNNNNN
create sequence if not exists public.case_number_seq;

create or replace function public.generate_case_number()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  select nextval('public.case_number_seq') into next_num;
  return 'USLP-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 6, '0');
end;
$$;

create table public.cases (
  id uuid primary key default uuid_generate_v4(),
  case_number text unique not null default public.generate_case_number(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  display_name text not null,
  beneficiary_data jsonb,
  intake_status text not null default 'created' check (intake_status in (
    'created',
    'contract_pending',
    'contract_signed',
    'payment_pending',
    'in_progress',
    'review_pending',
    'needs_correction',
    'approved',
    'finalized',
    'archived',
    'cancelled'
  )),
  service_status text,
  form_data jsonb not null default '{}'::jsonb,
  current_step text,
  completed_steps text[] not null default '{}',
  agreed_price_cents int,
  payment_plan_type text check (payment_plan_type in ('one_time', 'installments')),
  assigned_admin_id uuid references public.profiles(id),
  qa_review_required boolean not null default true,
  qa_reviewed_at timestamptz,
  qa_reviewed_by uuid references public.profiles(id),
  qa_review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

create index idx_cases_client on public.cases(client_id, created_at desc);
create index idx_cases_status on public.cases(intake_status);
create index idx_cases_admin on public.cases(assigned_admin_id) where assigned_admin_id is not null;

create trigger trg_cases_updated_at
  before update on public.cases
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- case_activities (timeline append-only)
-- ============================================================================
create table public.case_activities (
  id bigserial primary key,
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  actor_type text not null check (actor_type in ('client', 'admin', 'system', 'ai')),
  activity_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_case_activities_case on public.case_activities(case_id, created_at desc);

create rule case_activities_no_update as on update to public.case_activities do instead nothing;
create rule case_activities_no_delete as on delete to public.case_activities do instead nothing;

revoke update, delete on public.case_activities from authenticated, anon;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.cases enable row level security;
alter table public.case_activities enable row level security;

create policy "cases: self read"
  on public.cases for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "cases: self insert"
  on public.cases for insert to authenticated
  with check (client_id = auth.uid());

create policy "cases: self update during intake"
  on public.cases for update to authenticated
  using (
    client_id = auth.uid()
    and intake_status in ('created', 'in_progress', 'needs_correction')
  )
  with check (client_id = auth.uid());

create policy "cases: admin all"
  on public.cases for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "case_activities: self read"
  on public.case_activities for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and (c.client_id = auth.uid() or public.has_role('admin'))
    )
  );

-- INSERT en case_activities solo via service-role (server)
