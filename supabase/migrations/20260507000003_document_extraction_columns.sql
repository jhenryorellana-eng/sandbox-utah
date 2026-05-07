-- ============================================================================
-- 20260507000003_document_extraction_columns
-- Extiende documents con metadata de IA (extracción async + structured data)
-- y soporte de docs por menor (snapshot inmutable de label).
-- ============================================================================

alter table public.documents
  add column minor_id uuid references public.case_minors(id) on delete set null,
  add column minor_label text,
  add column extraction_status text not null default 'pending' check (extraction_status in (
    'pending', 'extracting', 'extracted', 'extraction_failed', 'skipped'
  )),
  add column extraction_attempts int not null default 0,
  add column extracted_text text,
  add column extracted_data jsonb,
  add column extracted_at timestamptz,
  add column extraction_error text;

create index idx_documents_extraction_pending on public.documents(extraction_status)
  where extraction_status in ('pending', 'extracting');

create index idx_documents_minor on public.documents(case_id, minor_id)
  where minor_id is not null;

-- Snapshot de minor_label es inmutable por disciplina app (UI nunca lo edita).
-- No se enforza con SQL para permitir backfills si fuera necesario.
