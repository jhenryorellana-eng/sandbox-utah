-- ============================================================================
-- 20260502000001_init_profiles_roles
-- Profiles + roles + helper has_role + trigger handle_new_user
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  date_of_birth date,
  phone text,
  preferred_language text not null default 'es' check (preferred_language in ('es', 'en')),
  utah_residency_verified boolean not null default false,
  utah_residency_verified_at timestamptz,
  utah_residency_method text,
  consents jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_profiles_email on public.profiles(email);

-- ----------------------------------------------------------------------------
-- user_roles (RBAC: solo client / admin)
-- El abogado supervisor del sandbox (Moderate Innovation) se modela como admin.
-- ----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('client', 'admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id),
  primary key (user_id, role)
);

create index idx_user_roles_role on public.user_roles(role);

-- ----------------------------------------------------------------------------
-- has_role(text): helper SECURITY DEFINER para policies RLS sin recursión.
-- Usar en RLS: USING (public.has_role('admin')).
-- ----------------------------------------------------------------------------
create or replace function public.has_role(check_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = check_role
  );
$$;

grant execute on function public.has_role(text) to authenticated, anon;

-- ----------------------------------------------------------------------------
-- handle_new_user: trigger que crea profile + asigna rol 'client' automáticamente
-- al crear un auth.users (signup). El locale se toma del raw_user_meta_data.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, preferred_language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'preferred_language', 'es')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'client');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- updated_at trigger genérico (reutilizado en otras tablas en sprints futuros)
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Habilitar RLS (las policies van en migration 20260502000004)
-- ----------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.user_roles enable row level security;
