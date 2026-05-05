-- ============================================================================
-- 20260502000004_rls_policies
-- Row Level Security policies para las 4 tablas de Sprint 1-2.
--
-- Default deny (RLS habilitado sin policy = 0 filas visibles).
-- Roles: client (auth.uid() = own_id) o admin (has_role('admin')).
-- ============================================================================

-- ============================================================================
-- profiles
-- ============================================================================
create policy "profiles: self read"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.has_role('admin'));

create policy "profiles: self update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin all"
  on public.profiles
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- INSERT no se permite directo: el trigger handle_new_user() lo crea automáticamente.

-- ============================================================================
-- user_roles
-- ============================================================================
create policy "user_roles: self read"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

create policy "user_roles: admin write"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- ============================================================================
-- audit_log
-- INSERT solo via service_role key (no policy → default deny para auth/anon).
-- ============================================================================
create policy "audit_log: self read"
  on public.audit_log
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

-- ============================================================================
-- consents
-- Cliente puede leer e insertar SUS PROPIOS consents; admin lee todos.
-- ============================================================================
create policy "consents: self read"
  on public.consents
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

create policy "consents: self insert"
  on public.consents
  for insert
  to authenticated
  with check (user_id = auth.uid());
