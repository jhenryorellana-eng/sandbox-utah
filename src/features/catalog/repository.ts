import "server-only"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"]
export type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
export type ServiceTierRow = Database["public"]["Tables"]["service_tiers"]["Row"]

export interface CategoryWithServices extends ServiceCategoryRow {
  services: ServiceRow[]
}

export interface ServiceWithTiers extends ServiceRow {
  tiers: ServiceTierRow[]
}

export interface CategoryWithServicesAndTiers extends ServiceCategoryRow {
  services: ServiceWithTiers[]
}

export async function fetchActiveCatalog(): Promise<CategoryWithServices[]> {
  const supabase = await createServerClient()
  const { data: categories, error: catErr } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
  if (catErr) throw catErr
  if (!categories || categories.length === 0) return []

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
  if (svcErr) throw svcErr

  return categories.map((category) => ({
    ...category,
    services: (services ?? []).filter((s) => s.category_id === category.id),
  }))
}

export async function fetchActiveCatalogWithTiers(): Promise<CategoryWithServicesAndTiers[]> {
  const supabase = await createServerClient()
  const [{ data: categories }, { data: services }, { data: tiers }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("services").select("*").eq("is_active", true).order("display_order"),
    supabase.from("service_tiers").select("*").eq("is_active", true).order("display_order"),
  ])
  if (!categories) return []
  return categories.map((category) => ({
    ...category,
    services: (services ?? [])
      .filter((s) => s.category_id === category.id)
      .map((s) => ({ ...s, tiers: (tiers ?? []).filter((t) => t.service_id === s.id) })),
  }))
}

export async function fetchAdminCatalog(): Promise<CategoryWithServicesAndTiers[]> {
  // Admin ve activos + inactivos (RLS permite admin all)
  const supabase = await createServerClient()
  const [{ data: categories }, { data: services }, { data: tiers }] = await Promise.all([
    supabase.from("service_categories").select("*").order("display_order"),
    supabase.from("services").select("*").order("display_order"),
    supabase.from("service_tiers").select("*").order("display_order"),
  ])
  if (!categories) return []
  return categories.map((category) => ({
    ...category,
    services: (services ?? [])
      .filter((s) => s.category_id === category.id)
      .map((s) => ({ ...s, tiers: (tiers ?? []).filter((t) => t.service_id === s.id) })),
  }))
}

export async function fetchServiceBySlug(slug: string): Promise<{
  service: ServiceRow
  category: ServiceCategoryRow
  tiers: ServiceTierRow[]
} | null> {
  const supabase = await createServerClient()
  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw error
  if (!service) return null

  const [{ data: category, error: catErr }, { data: tiers }] = await Promise.all([
    supabase.from("service_categories").select("*").eq("id", service.category_id).maybeSingle(),
    supabase
      .from("service_tiers")
      .select("*")
      .eq("service_id", service.id)
      .eq("is_active", true)
      .order("display_order"),
  ])
  if (catErr) throw catErr
  if (!category) return null

  return { service, category, tiers: tiers ?? [] }
}

export async function fetchServiceTier(tierId: string): Promise<ServiceTierRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("service_tiers")
    .select("*")
    .eq("id", tierId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchServiceTierAdmin(tierId: string): Promise<ServiceTierRow | null> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("service_tiers")
    .select("*")
    .eq("id", tierId)
    .maybeSingle()
  if (error) throw error
  return data
}
