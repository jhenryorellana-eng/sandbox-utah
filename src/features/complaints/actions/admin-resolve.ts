"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const resolveInput = z.object({
  complaintId: z.string().uuid(),
  resolution: z.string().min(5).max(2000),
  newStatus: z.enum(["resolved", "escalated"]).default("resolved"),
  reportToInnovationOffice: z.boolean().default(false),
})

async function requireAdmin(): Promise<string | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  return data ? user.id : null
}

export interface ResolveComplaintResult {
  ok: boolean
  errorCode?: "auth" | "not_admin" | "validation" | "generic"
  errorMessage?: string
}

export async function resolveComplaintAction(input: unknown): Promise<ResolveComplaintResult> {
  const parsed = resolveInput.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }
  const adminId = await requireAdmin()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: `complaint.${parsed.data.newStatus}`,
      resourceType: "complaints",
      resourceId: parsed.data.complaintId,
      userId: adminId,
      metadata: {
        reportToInnovationOffice: parsed.data.reportToInnovationOffice,
      },
    },
    async (): Promise<ResolveComplaintResult> => {
      const service = createServiceClient()
      const now = new Date().toISOString()
      const updates: {
        status: "resolved" | "escalated"
        assigned_to: string
        resolution: string
        resolved_at: string
        reported_to_innovation_office?: boolean
        reported_to_innovation_office_at?: string | null
      } = {
        status: parsed.data.newStatus,
        assigned_to: adminId,
        resolution: parsed.data.resolution,
        resolved_at: now,
      }
      if (parsed.data.reportToInnovationOffice) {
        updates.reported_to_innovation_office = true
        updates.reported_to_innovation_office_at = now
      }
      const { error } = await service
        .from("complaints")
        .update(updates)
        .eq("id", parsed.data.complaintId)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      revalidatePath("/admin/complaints")
      revalidatePath("/admin/compliance")
      return { ok: true }
    },
  )
}
