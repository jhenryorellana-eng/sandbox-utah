import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { ComplaintCategory, ComplaintStatus, Database } from "@/shared/types/database"

export type ComplaintRow = Database["public"]["Tables"]["complaints"]["Row"]

export async function fetchComplaintsAdmin(filter?: {
  status?: ComplaintStatus
  category?: ComplaintCategory
}): Promise<ComplaintRow[]> {
  const supabase = await createServerClient()
  let query = supabase.from("complaints").select("*").order("created_at", { ascending: false })
  if (filter?.status) query = query.eq("status", filter.status)
  if (filter?.category) query = query.eq("category", filter.category)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export interface ComplianceMetrics {
  servicesProvided: number
  uniqueClients: number
  complaintsByCategory: Record<ComplaintCategory, number>
  complaintsByStatus: Record<ComplaintStatus, number>
  totalComplaints: number
  /** Target: <1 per 4000 services. Mostramos como "1:N". */
  complaintRatio: number | null
  aiInteractions: number
  aiBlocked: number
  aiFlagged: number
}

export async function fetchComplianceMetrics(
  fromIso: string,
  toIso: string,
): Promise<ComplianceMetrics> {
  const supabase = await createServerClient()

  const [
    { data: cases, count: servicesCount },
    { data: complaints },
    { count: aiTotal },
    { count: aiBlocked },
    { count: aiFlagged },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select("client_id", { count: "exact" })
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
    supabase
      .from("complaints")
      .select("category, status")
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
    supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
    supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lt("created_at", toIso)
      .eq("blocked", true),
    supabase
      .from("ai_interactions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lt("created_at", toIso)
      .eq("user_flagged_inappropriate", true),
  ])

  const uniqueClients = new Set((cases ?? []).map((c) => c.client_id)).size
  const services = servicesCount ?? 0

  const initialCategories: Record<ComplaintCategory, number> = {
    inaccurate_result: 0,
    failed_exercise_rights: 0,
    unnecessary_service: 0,
    billing: 0,
    technical: 0,
    other: 0,
  }
  const initialStatuses: Record<ComplaintStatus, number> = {
    open: 0,
    investigating: 0,
    resolved: 0,
    escalated: 0,
  }
  for (const c of complaints ?? []) {
    initialCategories[c.category] = (initialCategories[c.category] ?? 0) + 1
    initialStatuses[c.status] = (initialStatuses[c.status] ?? 0) + 1
  }

  const total = complaints?.length ?? 0
  const ratio = total > 0 ? Math.round(services / total) : null

  return {
    servicesProvided: services,
    uniqueClients,
    complaintsByCategory: initialCategories,
    complaintsByStatus: initialStatuses,
    totalComplaints: total,
    complaintRatio: ratio,
    aiInteractions: aiTotal ?? 0,
    aiBlocked: aiBlocked ?? 0,
    aiFlagged: aiFlagged ?? 0,
  }
}
