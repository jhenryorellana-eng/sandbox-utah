-- ============================================================================
-- 20260507000002_case_minors
-- Hijos/beneficiarios en un caso. Editable mientras el caso esté en estados
-- early (created, contract_pending, in_progress, needs_correction). Snapshot
-- inmutable se materializa en contracts.terms_snapshot al firmar.
-- ============================================================================

create table public.case_minors (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  display_index int not null check (display_index >= 1),
  full_name text not null,
  date_of_birth date,
  document_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, display_index)
);

create index idx_case_minors_case on public.case_minors(case_id, display_index);

create trigger trg_case_minors_updated_at
  before update on public.case_minors
  for each row execute function public.touch_updated_at();

alter table public.case_minors enable row level security;

create policy "case_minors: client read"
  on public.case_minors for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and (c.client_id = auth.uid() or public.has_role('admin'))
    )
  );

create policy "case_minors: client insert during intake"
  on public.case_minors for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.client_id = auth.uid()
        and c.intake_status in ('created', 'contract_pending', 'in_progress', 'needs_correction')
    )
  );

create policy "case_minors: client update during intake"
  on public.case_minors for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.client_id = auth.uid()
        and c.intake_status in ('created', 'contract_pending', 'in_progress', 'needs_correction')
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.client_id = auth.uid()
        and c.intake_status in ('created', 'contract_pending', 'in_progress', 'needs_correction')
    )
  );

create policy "case_minors: client delete during intake"
  on public.case_minors for delete to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.client_id = auth.uid()
        and c.intake_status in ('created', 'contract_pending', 'in_progress', 'needs_correction')
    )
  );

create policy "case_minors: admin all"
  on public.case_minors for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
