-- ============================================================================
-- 20260507000001_service_tiers
-- Tiers de pricing por número de beneficiarios (ej. custodia 1 hijo $350,
-- 2 hijos $500). Servicios con allows_multiple_beneficiaries=true se rigen
-- por tiers; el resto usa services.base_price_cents.
-- ============================================================================

create table public.service_tiers (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete cascade,
  beneficiaries_count int not null check (beneficiaries_count >= 1),
  price_cents int not null check (price_cents >= 0),
  label_es text not null,
  label_en text not null,
  description_es text,
  description_en text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, beneficiaries_count)
);

create index idx_service_tiers_service on public.service_tiers(service_id, display_order);
create index idx_service_tiers_active on public.service_tiers(service_id) where is_active = true;

create trigger trg_service_tiers_updated_at
  before update on public.service_tiers
  for each row execute function public.touch_updated_at();

alter table public.service_tiers enable row level security;

create policy "service_tiers: public read"
  on public.service_tiers
  for select
  to anon, authenticated
  using (is_active = true or public.has_role('admin'));

create policy "service_tiers: admin write"
  on public.service_tiers
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
