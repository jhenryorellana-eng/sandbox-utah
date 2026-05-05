-- ============================================================================
-- 20260502000013_payments
-- Pagos 100% manuales (efectivo/Zelle/transferencia/cheque/money order).
-- Plan + cuotas + pagos reportados + comprobantes + recibos PDF.
-- ============================================================================

create sequence if not exists public.receipt_number_seq;

create or replace function public.generate_receipt_number()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  select nextval('public.receipt_number_seq') into next_num;
  return 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 6, '0');
end;
$$;

create table public.payment_plans (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.profiles(id),
  total_amount_cents int not null check (total_amount_cents > 0),
  payment_type text not null check (payment_type in ('one_time', 'installments')),
  num_installments int not null default 1 check (num_installments >= 1),
  down_payment_cents int not null default 0 check (down_payment_cents >= 0),
  status text not null default 'active' check (status in (
    'active', 'completed', 'cancelled', 'in_default'
  )),
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_plans_case on public.payment_plans(case_id);
create index idx_payment_plans_client on public.payment_plans(client_id);

create trigger trg_payment_plans_updated_at
  before update on public.payment_plans
  for each row execute function public.touch_updated_at();

create table public.installments (
  id uuid primary key default uuid_generate_v4(),
  payment_plan_id uuid not null references public.payment_plans(id) on delete cascade,
  installment_number int not null check (installment_number >= 0),
  amount_cents int not null check (amount_cents > 0),
  due_date date not null,
  status text not null default 'pending' check (status in (
    'pending', 'reported', 'verified', 'overdue', 'waived'
  )),
  payment_id uuid,
  created_at timestamptz not null default now(),
  unique (payment_plan_id, installment_number)
);

create index idx_installments_plan on public.installments(payment_plan_id, installment_number);
create index idx_installments_due on public.installments(due_date)
  where status in ('pending', 'overdue');

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  payment_plan_id uuid not null references public.payment_plans(id),
  installment_id uuid references public.installments(id),
  client_id uuid not null references public.profiles(id),
  case_id uuid not null references public.cases(id),
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'usd',
  payment_method text not null check (payment_method in (
    'cash', 'zelle', 'bank_transfer', 'check', 'money_order',
    'cashapp', 'venmo', 'other'
  )),
  payment_method_details text,
  payment_date date not null,
  status text not null default 'reported' check (status in (
    'reported', 'verified', 'rejected', 'refunded'
  )),
  reported_by uuid not null references public.profiles(id),
  reported_by_role text not null check (reported_by_role in ('client', 'admin')),
  reported_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  verification_notes text,
  rejection_reason text,
  refunded_at timestamptz,
  refunded_by uuid references public.profiles(id),
  refund_amount_cents int default 0,
  refund_reason text,
  created_at timestamptz not null default now()
);

create index idx_payments_status on public.payments(status, reported_at desc);
create index idx_payments_case on public.payments(case_id);
create index idx_payments_pending on public.payments(reported_at)
  where status = 'reported';

-- FK delayed para evitar ciclo
alter table public.installments
  add constraint installments_payment_id_fkey
  foreign key (payment_id) references public.payments(id) on delete set null;

create table public.payment_proofs (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes int not null,
  sha256_hash text not null,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create index idx_payment_proofs_payment on public.payment_proofs(payment_id);

create table public.payment_receipts (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  receipt_number text unique not null default public.generate_receipt_number(),
  pdf_storage_path text,
  generated_at timestamptz not null default now(),
  emailed_to text,
  emailed_at timestamptz
);

create index idx_payment_receipts_payment on public.payment_receipts(payment_id);

-- Receipts inmutables
create rule payment_receipts_no_update as on update to public.payment_receipts do instead nothing;
create rule payment_receipts_no_delete as on delete to public.payment_receipts do instead nothing;

revoke update, delete on public.payment_receipts from authenticated, anon;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.payment_plans enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.payment_receipts enable row level security;

-- payment_plans: cliente lee suyos, admin todo
create policy "payment_plans: self read"
  on public.payment_plans for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "payment_plans: admin write"
  on public.payment_plans for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- installments: igual
create policy "installments: self read"
  on public.installments for select to authenticated
  using (
    exists (
      select 1 from public.payment_plans pp
      where pp.id = payment_plan_id
        and (pp.client_id = auth.uid() or public.has_role('admin'))
    )
  );

create policy "installments: admin write"
  on public.installments for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- payments: cliente lee+inserta suyos, admin verifica
create policy "payments: self read"
  on public.payments for select to authenticated
  using (client_id = auth.uid() or public.has_role('admin'));

create policy "payments: client insert"
  on public.payments for insert to authenticated
  with check (
    client_id = auth.uid()
    and reported_by = auth.uid()
    and reported_by_role = 'client'
    and status = 'reported'
  );

create policy "payments: admin all"
  on public.payments for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- payment_proofs: cliente lee+sube sus comprobantes
create policy "payment_proofs: self read"
  on public.payment_proofs for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (p.client_id = auth.uid() or public.has_role('admin'))
    )
  );

create policy "payment_proofs: client insert"
  on public.payment_proofs for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.payments p
      where p.id = payment_id and p.client_id = auth.uid()
    )
  );

create policy "payment_proofs: admin all"
  on public.payment_proofs for all to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- payment_receipts: cliente lee suyos
create policy "payment_receipts: self read"
  on public.payment_receipts for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (p.client_id = auth.uid() or public.has_role('admin'))
    )
  );

-- INSERT solo via service-role (admin verifica → server genera receipt)
