-- ============================================================================
-- 20260507000004_document_types_extension
-- Extiende document_types con flags para per_minor, slot_kind y schema de
-- extracción IA, portado del proyecto referencia (Visa Juvenil/Custodia).
-- ============================================================================

alter table public.document_types
  add column is_per_minor boolean not null default false,
  add column slot_kind text not null default 'single' check (slot_kind in (
    'single', 'dual_es_en', 'multiple_named'
  )),
  add column extraction_schema_slug text,
  add column conditional_logic jsonb;

create index idx_document_types_extraction
  on public.document_types(extraction_schema_slug)
  where extraction_schema_slug is not null;
