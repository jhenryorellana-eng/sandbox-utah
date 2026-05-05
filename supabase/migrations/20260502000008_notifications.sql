-- ============================================================================
-- 20260502000008_notifications
-- In-app notifications + canales (email/sms/push) para sprints futuros.
-- ============================================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  delivered_via text[] not null default '{in_app}',
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications: self read"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role('admin'));

create policy "notifications: self mark read"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: admin all"
  on public.notifications
  for all
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- INSERT solo via service-role (server). Sin policy.
