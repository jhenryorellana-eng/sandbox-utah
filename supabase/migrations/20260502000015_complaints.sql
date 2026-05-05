-- ============================================================================
-- 20260502000015_complaints
-- Sistema de complaints obligatorio para sandbox.
-- Categorías = Consumer Harm Framework (REQUERIMIENTOS §8.5).
-- Append-only post-resolución (status='resolved'/'escalated' es inmutable).
-- ============================================================================

create sequence if not exists public.complaint_number_seq;

create or replace function public.generate_complaint_number()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  select nextval('public.complaint_number_seq') into next_num;
  return 'COMP-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 6, '0');
end;
$$;

create table public.complaints (
  id uuid primary key default uuid_generate_v4(),
  complaint_number text unique not null default public.generate_complaint_number(),
  case_id uuid references public.cases(id),
  client_id uuid references public.profiles(id),
  reporter_email text not null,
  reporter_name text,
  category text not null check (category in (
    'inaccurate_result',
    'failed_exercise_rights',
    'unnecessary_service',
    'billing',
    'technical',
    'other'
  )),
  subject text not null,
  description text not null,
  locale text not null check (locale in ('es', 'en')),
  status text not null default 'open' check (status in (
    'open', 'investigating', 'resolved', 'escalated'
  )),
  assigned_to uuid references public.profiles(id),
  resolution text,
  resolved_at timestamptz,
  reported_to_innovation_office boolean not null default false,
  reported_to_innovation_office_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_complaints_status on public.complaints(status, created_at desc);
create index idx_complaints_category on public.complaints(category);
create index idx_complaints_client on public.complaints(client_id) where client_id is not null;

create trigger trg_complaints_updated_at
  before update on public.complaints
  for each row execute function public.touch_updated_at();

alter table public.complaints enable row level security;

-- Cliente lee sus quejas, inserta nuevas; admin todo.
create policy "complaints: self read"
  on public.complaints for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'))
  -- (la columna client_id puede ser NULL para anónimas, las admin las ve)
  ;

create policy "complaints: anon insert"
  on public.complaints for insert to anon, authenticated
  with check (
    (client_id is null and auth.uid() is null)
    or client_id = auth.uid()
  );

create policy "complaints: admin all"
  on public.complaints for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- ============================================================================
-- Trigger: append entry a case_activities cuando se crea complaint asociada a caso
-- ============================================================================
create or replace function public.complaint_activity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.case_id is not null then
    insert into public.case_activities (case_id, actor_id, actor_type, activity_type, description, metadata)
    values (
      new.case_id,
      new.client_id,
      'client',
      'complaint.created',
      'Cliente presentó queja',
      jsonb_build_object('complaint_id', new.id, 'category', new.category)
    );
  end if;
  return new;
end;
$$;

create trigger trg_complaints_activity
  after insert on public.complaints
  for each row execute function public.complaint_activity_trigger();
