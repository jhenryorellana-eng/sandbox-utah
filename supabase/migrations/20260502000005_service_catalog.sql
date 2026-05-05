-- ============================================================================
-- 20260502000005_service_catalog
-- Catálogo de servicios bilingüe (Familia / Vivienda / Empresarial).
-- Mismas reglas: RLS habilitado, escritura solo admin.
-- ============================================================================

create table public.service_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name_es text not null,
  name_en text not null,
  description_es text,
  description_en text,
  icon text,
  color_hex text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_service_categories_active on public.service_categories(is_active, display_order);

create trigger trg_service_categories_updated_at
  before update on public.service_categories
  for each row execute function public.touch_updated_at();

create table public.services (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  slug text unique not null,
  name_es text not null,
  name_en text not null,
  short_description_es text not null,
  short_description_en text not null,
  long_description_es text,
  long_description_en text,
  what_it_includes_es jsonb not null default '[]'::jsonb,
  what_it_includes_en jsonb not null default '[]'::jsonb,
  what_it_does_not_include_es jsonb not null default '[]'::jsonb,
  what_it_does_not_include_en jsonb not null default '[]'::jsonb,
  base_price_cents int not null check (base_price_cents >= 0),
  estimated_duration_minutes int,
  workflow_slug text not null,
  required_documents jsonb not null default '[]'::jsonb,
  pdf_template_path text,
  beneficiary_label_es text,
  beneficiary_label_en text,
  allows_multiple_beneficiaries boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_category on public.services(category_id, display_order);
create index idx_services_active on public.services(is_active);

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.touch_updated_at();

alter table public.service_categories enable row level security;
alter table public.services enable row level security;

-- Policies: lectura pública (anon + authenticated), escritura admin
create policy "service_categories: public read"
  on public.service_categories
  for select
  to anon, authenticated
  using (is_active = true or public.has_role('admin'));

create policy "service_categories: admin write"
  on public.service_categories
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "services: public read"
  on public.services
  for select
  to anon, authenticated
  using (is_active = true or public.has_role('admin'));

create policy "services: admin write"
  on public.services
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
