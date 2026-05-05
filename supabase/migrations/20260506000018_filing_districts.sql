-- ============================================================================
-- 20260506000018_filing_districts
-- Tablas de catálogo y operación para la pestaña "Radicación por Distrito".
--
-- 1. judicial_districts        — los 8 distritos judiciales de Utah.
-- 2. utah_counties             — 29 condados con su distrito.
-- 3. court_locations           — sedes (district / justice / juvenile).
-- 4. official_court_forms      — formularios oficiales de utcourts.gov + cache.
-- 5. case_filing_procedures    — pasos + venue + fees por (servicio, distrito).
-- 6. case_filing_packets       — snapshot inmutable por caso.
-- 7. filing_packet_prints      — audit log append-only de impresiones.
--
-- Catálogo (1-5) público (SELECT anon/authenticated). Operación (6-7) RLS por
-- dueño-del-caso o admin. Patrón has_role consistente con migraciones previas.
-- ============================================================================

-- ============================================================================
-- 1. judicial_districts
-- ============================================================================
create table public.judicial_districts (
  id smallint primary key check (id between 1 and 8),
  name_es text not null,
  name_en text not null,
  seat_city text not null,
  seat_address text,
  phone text,
  website_url text not null,
  email_filing_supported boolean not null default false,
  notes_es text,
  notes_en text,
  updated_at timestamptz not null default now()
);

create trigger trg_judicial_districts_updated_at
  before update on public.judicial_districts
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 2. utah_counties
-- ============================================================================
create table public.utah_counties (
  fips_code text primary key check (fips_code ~ '^49[0-9]{3}$'),
  name text not null unique,
  district_id smallint not null references public.judicial_districts(id) on delete restrict,
  has_juvenile_court boolean not null default true,
  has_justice_court boolean not null default true
);

create index idx_utah_counties_district on public.utah_counties(district_id);
create index idx_utah_counties_name_lower on public.utah_counties(lower(name));

-- ============================================================================
-- 3. court_locations
-- ============================================================================
create table public.court_locations (
  id uuid primary key default uuid_generate_v4(),
  district_id smallint not null references public.judicial_districts(id) on delete restrict,
  county_fips text references public.utah_counties(fips_code) on delete set null,
  court_type text not null check (court_type in ('district', 'justice', 'juvenile')),
  name_es text not null,
  name_en text not null,
  street text not null,
  city text not null,
  state text not null default 'UT',
  zip text not null,
  phone text,
  hours text,
  website_url text,
  efiling_url text,
  self_help_center_phone text,
  google_maps_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_court_locations_district on public.court_locations(district_id, court_type);
create index idx_court_locations_county on public.court_locations(county_fips) where county_fips is not null;

create trigger trg_court_locations_updated_at
  before update on public.court_locations
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 4. official_court_forms
-- ============================================================================
create table public.official_court_forms (
  id uuid primary key default uuid_generate_v4(),
  form_code text not null unique,
  service_slugs text[] not null default '{}',
  district_specific smallint references public.judicial_districts(id) on delete set null,
  name_es text not null,
  name_en text not null,
  description_es text,
  description_en text,
  url_official text not null,
  url_official_alt text,
  format text not null default 'pdf' check (format in ('pdf', 'docx', 'mypaperwork', 'html')),
  cached_storage_path text,
  cached_sha256 text,
  cached_at timestamptz,
  cache_size_bytes integer check (cache_size_bytes is null or cache_size_bytes >= 0),
  last_url_check_at timestamptz,
  last_url_status integer,
  is_mandatory boolean not null default true,
  ordering smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_official_court_forms_service on public.official_court_forms using gin(service_slugs);
create index idx_official_court_forms_district
  on public.official_court_forms(district_specific) where district_specific is not null;
create index idx_official_court_forms_active on public.official_court_forms(is_active) where is_active = true;

create trigger trg_official_court_forms_updated_at
  before update on public.official_court_forms
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 5. case_filing_procedures
-- ============================================================================
create table public.case_filing_procedures (
  id uuid primary key default uuid_generate_v4(),
  service_slug text not null references public.services(slug) on delete cascade,
  district_id smallint references public.judicial_districts(id) on delete cascade,
  intake_channel text not null check (intake_channel in (
    'in_person', 'mail', 'email', 'mycase', 'efile', 'hybrid'
  )),
  intake_steps_es jsonb not null default '[]'::jsonb,
  intake_steps_en jsonb not null default '[]'::jsonb,
  intake_filing_fee_cents integer not null check (intake_filing_fee_cents >= 0),
  intake_fee_waiver_form_code text references public.official_court_forms(form_code)
    deferrable initially deferred,
  case_steps_es jsonb not null default '[]'::jsonb,
  case_steps_en jsonb not null default '[]'::jsonb,
  case_typical_duration_days integer check (case_typical_duration_days is null or case_typical_duration_days > 0),
  venue_rule_es text not null,
  venue_rule_en text not null,
  venue_statute_ref text not null,
  source_urls jsonb not null default '[]'::jsonb,
  last_verified_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidad: (service_slug, district_id), tratando NULL como -1 para "statewide".
create unique index uq_case_filing_procedures_service_district
  on public.case_filing_procedures(service_slug, coalesce(district_id, -1));

create index idx_case_filing_procedures_service on public.case_filing_procedures(service_slug);
create index idx_case_filing_procedures_district
  on public.case_filing_procedures(district_id) where district_id is not null;

create trigger trg_case_filing_procedures_updated_at
  before update on public.case_filing_procedures
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 6. case_filing_packets (snapshot inmutable por caso)
-- ============================================================================
create table public.case_filing_packets (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  district_id smallint not null references public.judicial_districts(id) on delete restrict,
  procedure_id uuid not null references public.case_filing_procedures(id) on delete restrict,

  -- Snapshot inmutable: una vez escrito, los servicios sólo lo leen. Cualquier
  -- regeneración crea un row nuevo (deprecating el anterior por trigger app-side).
  intake_steps_snapshot_es jsonb not null,
  intake_steps_snapshot_en jsonb not null,
  case_steps_snapshot_es jsonb not null,
  case_steps_snapshot_en jsonb not null,
  forms_snapshot jsonb not null,        -- [{form_code, name_es, name_en, url_official, sha256, is_mandatory, ordering}]
  fee_snapshot_cents integer not null check (fee_snapshot_cents >= 0),

  -- Capa AI (opcional)
  ai_narrative_es text,
  ai_narrative_en text,
  ai_warnings jsonb not null default '[]'::jsonb,
  ai_model text,
  ai_grounded_sources jsonb not null default '[]'::jsonb,

  -- Auditoría de address resolution
  resolved_from text not null check (resolved_from in (
    'identity_doc', 'client_zip', 'client_address', 'manual_county'
  )),
  resolved_county_fips text not null references public.utah_counties(fips_code),

  generated_at timestamptz not null default now(),
  generated_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  last_printed_at timestamptz,
  print_count integer not null default 0 check (print_count >= 0)
);

create index idx_case_filing_packets_case on public.case_filing_packets(case_id);
create index idx_case_filing_packets_district on public.case_filing_packets(district_id);
create index idx_case_filing_packets_generated on public.case_filing_packets(generated_at desc);

-- Snapshot fields no se modifican una vez escritos (regla append-only para inmutabilidad de
-- los campos *_snapshot y forms_snapshot). Los counters (print_count, last_printed_at,
-- reviewed_*, ai_*) sí se pueden actualizar por el server.
create or replace function public.guard_case_filing_packets_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.intake_steps_snapshot_es is distinct from new.intake_steps_snapshot_es then
    raise exception 'case_filing_packets.intake_steps_snapshot_es is immutable';
  end if;
  if old.intake_steps_snapshot_en is distinct from new.intake_steps_snapshot_en then
    raise exception 'case_filing_packets.intake_steps_snapshot_en is immutable';
  end if;
  if old.case_steps_snapshot_es is distinct from new.case_steps_snapshot_es then
    raise exception 'case_filing_packets.case_steps_snapshot_es is immutable';
  end if;
  if old.case_steps_snapshot_en is distinct from new.case_steps_snapshot_en then
    raise exception 'case_filing_packets.case_steps_snapshot_en is immutable';
  end if;
  if old.forms_snapshot is distinct from new.forms_snapshot then
    raise exception 'case_filing_packets.forms_snapshot is immutable';
  end if;
  if old.fee_snapshot_cents is distinct from new.fee_snapshot_cents then
    raise exception 'case_filing_packets.fee_snapshot_cents is immutable';
  end if;
  if old.case_id is distinct from new.case_id then
    raise exception 'case_filing_packets.case_id is immutable';
  end if;
  if old.district_id is distinct from new.district_id then
    raise exception 'case_filing_packets.district_id is immutable';
  end if;
  if old.procedure_id is distinct from new.procedure_id then
    raise exception 'case_filing_packets.procedure_id is immutable';
  end if;
  if old.resolved_from is distinct from new.resolved_from then
    raise exception 'case_filing_packets.resolved_from is immutable';
  end if;
  if old.resolved_county_fips is distinct from new.resolved_county_fips then
    raise exception 'case_filing_packets.resolved_county_fips is immutable';
  end if;
  return new;
end;
$$;

create trigger trg_case_filing_packets_immutable
  before update on public.case_filing_packets
  for each row execute function public.guard_case_filing_packets_immutable();

-- ============================================================================
-- 7. filing_packet_prints (audit log append-only)
-- ============================================================================
create table public.filing_packet_prints (
  id bigserial primary key,
  packet_id uuid not null references public.case_filing_packets(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid references public.profiles(id),
  user_role text not null check (user_role in ('client', 'admin')),
  print_type text not null check (print_type in (
    'full_packet', 'intake_only', 'case_only', 'single_form', 'cover_sheet'
  )),
  form_codes text[] not null default '{}',
  pdf_storage_path text not null,
  pdf_sha256 text not null,
  pdf_size_bytes integer not null check (pdf_size_bytes >= 0),
  ip_address inet,
  user_agent text,
  printed_at timestamptz not null default now()
);

create index idx_filing_packet_prints_packet on public.filing_packet_prints(packet_id, printed_at desc);
create index idx_filing_packet_prints_case on public.filing_packet_prints(case_id, printed_at desc);
create index idx_filing_packet_prints_user on public.filing_packet_prints(user_id) where user_id is not null;

-- Append-only (mismo patrón que audit_log y case_activities).
create rule filing_packet_prints_no_update as on update to public.filing_packet_prints do instead nothing;
create rule filing_packet_prints_no_delete as on delete to public.filing_packet_prints do instead nothing;

revoke update, delete on public.filing_packet_prints from authenticated, anon;

-- ============================================================================
-- ALTER cases: enlazar a distrito + condado + corte resueltos
-- ============================================================================
alter table public.cases
  add column filing_county_fips text references public.utah_counties(fips_code),
  add column filing_district_id smallint references public.judicial_districts(id),
  add column filing_court_id uuid references public.court_locations(id);

create index idx_cases_filing_district
  on public.cases(filing_district_id) where filing_district_id is not null;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.judicial_districts enable row level security;
alter table public.utah_counties enable row level security;
alter table public.court_locations enable row level security;
alter table public.official_court_forms enable row level security;
alter table public.case_filing_procedures enable row level security;
alter table public.case_filing_packets enable row level security;
alter table public.filing_packet_prints enable row level security;

-- ----- Catálogo: SELECT público (sin PII) -----
create policy "judicial_districts: public read"
  on public.judicial_districts for select to anon, authenticated using (true);

create policy "judicial_districts: admin write"
  on public.judicial_districts for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "utah_counties: public read"
  on public.utah_counties for select to anon, authenticated using (true);

create policy "utah_counties: admin write"
  on public.utah_counties for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "court_locations: public read"
  on public.court_locations for select to anon, authenticated using (is_active = true or public.has_role('admin'));

create policy "court_locations: admin write"
  on public.court_locations for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "official_court_forms: public read"
  on public.official_court_forms for select to anon, authenticated using (is_active = true or public.has_role('admin'));

create policy "official_court_forms: admin write"
  on public.official_court_forms for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "case_filing_procedures: public read"
  on public.case_filing_procedures for select to anon, authenticated using (is_active = true or public.has_role('admin'));

create policy "case_filing_procedures: admin write"
  on public.case_filing_procedures for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- ----- Operación: dueño-del-caso o admin -----
create policy "case_filing_packets: self read"
  on public.case_filing_packets for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id and (c.client_id = auth.uid() or public.has_role('admin'))
    )
  );

create policy "case_filing_packets: admin all"
  on public.case_filing_packets for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- INSERT/UPDATE de packets: sólo via service-role (server actions). No policy para authenticated => default deny.

create policy "filing_packet_prints: self read"
  on public.filing_packet_prints for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_id and (c.client_id = auth.uid() or public.has_role('admin'))
    )
  );

-- INSERT en filing_packet_prints sólo via service-role (no policy para authenticated).
