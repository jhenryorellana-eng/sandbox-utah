-- ============================================================================
-- 20260502000014_documents
-- Documentos del caso (subidos por cliente o generados por la plataforma).
-- + buckets de Storage privados scoped por case_id.
-- ============================================================================

create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  document_type_id uuid references public.document_types(id),
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes int not null,
  sha256_hash text not null,
  uploaded_by uuid not null references public.profiles(id),
  is_generated boolean not null default false,
  is_signed boolean not null default false,
  status text not null default 'uploaded' check (status in (
    'uploaded', 'approved', 'rejected', 'archived'
  )),
  review_notes text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_documents_case on public.documents(case_id, created_at desc);
create index idx_documents_client on public.documents(client_id);
create index idx_documents_type on public.documents(document_type_id) where document_type_id is not null;

alter table public.documents enable row level security;

create policy "documents: self read"
  on public.documents for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "documents: client upload"
  on public.documents for insert to authenticated
  with check (
    client_id = auth.uid() and uploaded_by = auth.uid() and is_generated = false
  );

create policy "documents: admin all"
  on public.documents for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- ============================================================================
-- Storage buckets para documentos de caso y PDFs generados.
-- Path convention: <client_id>/<case_id>/<document_id>.<ext>
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'case-documents',
    'case-documents',
    false,
    20971520,                              -- 20 MB
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'generated-pdfs',
    'generated-pdfs',
    false,
    20971520,
    array['application/pdf']
  ),
  (
    'payment-proofs',
    'payment-proofs',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

-- Policies por bucket — folder root = client_id
create policy "case-documents: self read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role('admin'))
  );

create policy "case-documents: self insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "case-documents: admin all"
  on storage.objects for all to authenticated
  using (bucket_id = 'case-documents' and public.has_role('admin'))
  with check (bucket_id = 'case-documents' and public.has_role('admin'));

create policy "generated-pdfs: self read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'generated-pdfs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role('admin'))
  );

-- generated-pdfs INSERT/UPDATE solo via service-role
create policy "generated-pdfs: admin all"
  on storage.objects for all to authenticated
  using (bucket_id = 'generated-pdfs' and public.has_role('admin'))
  with check (bucket_id = 'generated-pdfs' and public.has_role('admin'));

create policy "payment-proofs: self read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role('admin'))
  );

create policy "payment-proofs: self insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment-proofs: admin all"
  on storage.objects for all to authenticated
  using (bucket_id = 'payment-proofs' and public.has_role('admin'))
  with check (bucket_id = 'payment-proofs' and public.has_role('admin'));
