-- ============================================================================
-- 20260507000005_form_responses
-- Respuestas a formularios oficiales del distrito judicial. Una fila por
-- (case_id, form_slug). Los formularios se definen en código (registry
-- hardcoded en src/server/legal/utah-courts/forms/).
-- ============================================================================

create table public.form_responses (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  form_slug text not null,
  responses jsonb not null default '{}'::jsonb,
  prefilled_from jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'printed')),
  last_printed_at timestamptz,
  print_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, form_slug)
);

create index idx_form_responses_case on public.form_responses(case_id);
create index idx_form_responses_status on public.form_responses(status);

create trigger trg_form_responses_updated_at
  before update on public.form_responses
  for each row execute function public.touch_updated_at();

alter table public.form_responses enable row level security;

create policy "form_responses: client read"
  on public.form_responses for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "form_responses: client insert"
  on public.form_responses for insert to authenticated
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = case_id
        and c.client_id = auth.uid()
        and c.intake_status in ('contract_signed', 'in_progress', 'needs_correction')
    )
  );

create policy "form_responses: client update"
  on public.form_responses for update to authenticated
  using (
    client_id = auth.uid()
    and status in ('draft', 'submitted')
  )
  with check (client_id = auth.uid());

create policy "form_responses: admin all"
  on public.form_responses for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
