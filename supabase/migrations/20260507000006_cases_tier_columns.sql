-- ============================================================================
-- 20260507000006_cases_tier_columns
-- Vincula cases a service_tiers (cuando aplique). Campo beneficiary_count
-- redundante con count de case_minors pero útil para queries rápidas y
-- snapshot legible.
-- ============================================================================

alter table public.cases
  add column service_tier_id uuid references public.service_tiers(id),
  add column beneficiary_count int check (beneficiary_count is null or beneficiary_count >= 1);

create index idx_cases_tier on public.cases(service_tier_id) where service_tier_id is not null;
