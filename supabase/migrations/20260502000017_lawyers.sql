-- ============================================================================
-- 20260502000017_lawyers
-- Directorio de abogados aliados Utah + supervisor del sandbox.
-- Lectura pública (bio + practice areas). Escritura solo admin.
-- ============================================================================

create table public.lawyers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id),
  full_name text not null,
  bar_number text not null,
  bar_state text not null default 'UT',
  practice_areas text[] not null default '{}',
  languages text[] not null default '{en}',
  bio_es text,
  bio_en text,
  hourly_rate_cents int,
  email text,
  phone text,
  website_url text,
  is_supervisor boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bar_number, bar_state)
);

create index idx_lawyers_active on public.lawyers(is_active, full_name);
create index idx_lawyers_areas on public.lawyers using gin(practice_areas);
create index idx_lawyers_languages on public.lawyers using gin(languages);

create trigger trg_lawyers_updated_at
  before update on public.lawyers
  for each row execute function public.touch_updated_at();

alter table public.lawyers enable row level security;

-- Lectura pública (anon y authenticated) de abogados activos
create policy "lawyers: public read"
  on public.lawyers for select to anon, authenticated
  using (is_active = true or public.has_role('admin'));

create policy "lawyers: admin write"
  on public.lawyers for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
