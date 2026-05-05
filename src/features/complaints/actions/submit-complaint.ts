"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const inputSchema = z.object({
  caseId: z.string().uuid().optional(),
  reporterEmail: z.string().email(),
  reporterName: z.string().max(120).optional(),
  category: z.enum([
    "inaccurate_result",
    "failed_exercise_rights",
    "unnecessary_service",
    "billing",
    "technical",
    "other",
  ]),
  subject: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  locale: z.enum(["es", "en"]).default("es"),
})

export interface SubmitComplaintResult {
  ok: boolean
  complaintNumber?: string
  errorCode?: "validation" | "generic"
  errorMessage?: string
}

export async function submitComplaintAction(input: unknown): Promise<SubmitComplaintResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim()
  const userAgent = h.get("user-agent")

  return withCompliance(
    {
      action: "complaint.submitted",
      resourceType: "complaints",
      ...(user?.id ? { userId: user.id } : {}),
      metadata: { category: parsed.data.category, anonymous: !user },
    },
    async (): Promise<SubmitComplaintResult> => {
      // Insertamos via service role para cubrir caso anónimo (sin sesión)
      const service = createServiceClient()
      const { data: row, error } = await service
        .from("complaints")
        .insert({
          case_id: parsed.data.caseId ?? null,
          client_id: user?.id ?? null,
          reporter_email: parsed.data.reporterEmail,
          reporter_name: parsed.data.reporterName ?? null,
          category: parsed.data.category,
          subject: parsed.data.subject,
          description: parsed.data.description,
          locale: parsed.data.locale,
          ip_address: ip ?? null,
          user_agent: userAgent ?? null,
        })
        .select("complaint_number")
        .single()
      if (error || !row) {
        return { ok: false, errorCode: "generic", errorMessage: error?.message }
      }
      return { ok: true, complaintNumber: row.complaint_number }
    },
  )
}
