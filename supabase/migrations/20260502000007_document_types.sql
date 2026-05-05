-- ============================================================================
-- 20260502000007_document_types
-- Catálogo de tipos de documentos que el cliente puede subir según servicio.
-- ============================================================================

create table public.document_types (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name_es text not null,
  name_en text not null,
  description_es text,
  description_en text,
  applicable_services text[] not null default '{}',
  is_required_default boolean not null default false,
  accepts_file_types text[] not null default '{image/jpeg,image/png,application/pdf}',
  max_size_bytes int not null default 10485760,                 -- 10 MB
  created_at timestamptz not null default now()
);

create index idx_document_types_services on public.document_types using gin(applicable_services);

alter table public.document_types enable row level security;

create policy "document_types: public read"
  on public.document_types
  for select
  to anon, authenticated
  using (true);

create policy "document_types: admin write"
  on public.document_types
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
