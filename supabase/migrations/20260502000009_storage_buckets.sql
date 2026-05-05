-- ============================================================================
-- 20260502000009_storage_buckets
-- Buckets de Supabase Storage:
--   - identity-documents: privado, solo el dueño y admin pueden leer/escribir.
--   - case-documents: privado, scoped por caso (Sprint 5-6).
--   - generated-pdfs: privado, scoped por caso (Sprint 5-6).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'identity-documents',
    'identity-documents',
    false,
    10485760,                                    -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

-- RLS policies sobre storage.objects para el bucket identity-documents.
-- Path convention: <user_id>/<verification_id>/<front|back|proof>.<ext>
create policy "identity-documents: self read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'identity-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role('admin')
    )
  );

create policy "identity-documents: self insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identity-documents: self update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identity-documents: self delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identity-documents: admin all"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'identity-documents' and public.has_role('admin')
  )
  with check (
    bucket_id = 'identity-documents' and public.has_role('admin')
  );
