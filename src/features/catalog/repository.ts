import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"]
export type ServiceRow = Database["public"]["Tables"]["services"]["Row"]

export interface CategoryWithServices extends ServiceCategoryRow {
  services: ServiceRow[]
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

export async function fetchServiceBySlug(slug: string): Promise<{
  service: ServiceRow
  category: ServiceCategoryRow
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

  const { data: category, error: catErr } = await supabase
    .from("service_categories")
    .select("*")
    .eq("id", service.category_id)
    .maybeSingle()
  if (catErr) throw catErr
  if (!category) return null

  return { service, category }
}
