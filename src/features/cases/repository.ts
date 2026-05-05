import "server-only"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import type { ActorType, Database, Json } from "@/shared/types/database"

export type CaseRow = Database["public"]["Tables"]["cases"]["Row"]
export type CaseActivityRow = Database["public"]["Tables"]["case_activities"]["Row"]

export interface CaseWithService extends CaseRow {
  service: {
    name_es: string
    name_en: string
    workflow_slug: string
    base_price_cents: number
    pdf_template_path: string | null
  }
}

export async function fetchCasesByClient(clientId: string): Promise<CaseWithService[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("cases")
    .select(
      "*, service:services(name_es, name_en, workflow_slug, base_price_cents, pdf_template_path)",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as CaseWithService[]
}

export async function fetchCaseById(
  caseId: string,
  clientId: string,
): Promise<CaseWithService | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("cases")
    .select(
      "*, service:services(name_es, name_en, workflow_slug, base_price_cents, pdf_template_path)",
    )
    .eq("id", caseId)
    .eq("client_id", clientId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as CaseWithService | null
}

export async function fetchCaseAdmin(caseId: string): Promise<CaseWithService | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("cases")
    .select(
      "*, service:services(name_es, name_en, workflow_slug, base_price_cents, pdf_template_path)",
    )
    .eq("id", caseId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as CaseWithService | null
}

export async function fetchAllCasesAdmin(): Promise<CaseWithService[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("cases")
    .select(
      "*, service:services(name_es, name_en, workflow_slug, base_price_cents, pdf_template_path)",
    )
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as unknown as CaseWithService[]
}

export async function appendCaseActivity(input: {
  caseId: string
  actorId: string | null
  actorType: ActorType
  activityType: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  // Service-role bypass: case_activities tiene RULES no-update/no-delete y no
  // tiene policy de INSERT, así que el server escribe vía service role.
  const service = createServiceClient()
  const { error } = await service.from("case_activities").insert({
    case_id: input.caseId,
    actor_id: input.actorId,
    actor_type: input.actorType,
    activity_type: input.activityType,
    description: input.description ?? null,
    metadata: (input.metadata ?? null) as Json | null,
  })
  if (error) console.error("[case_activities] insert failed", error.message)
}
