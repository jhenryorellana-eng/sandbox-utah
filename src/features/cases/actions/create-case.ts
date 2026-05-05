"use server"

import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import type { Json } from "@/shared/types/database"
import { appendCaseActivity } from "../repository"

const createCaseInput = z.object({
  serviceSlug: z.string().min(2),
  displayName: z.string().min(2).max(120),
  beneficiary: z
    .object({
      full_name: z.string().min(2).optional(),
      relationship: z.string().optional(),
      date_of_birth: z.string().optional(),
    })
    .optional(),
})

export interface CreateCaseResult {
  ok: boolean
  caseId?: string
  errorCode?: "auth" | "validation" | "service_not_found" | "residency_required" | "generic"
  errorMessage?: string
}

export async function createCaseAction(input: unknown): Promise<CreateCaseResult> {
  const parsed = createCaseInput.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("utah_residency_verified")
    .eq("id", user.id)
    .single()
  if (!profile?.utah_residency_verified) {
    return { ok: false, errorCode: "residency_required" }
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, base_price_cents")
    .eq("slug", parsed.data.serviceSlug)
    .eq("is_active", true)
    .maybeSingle()
  if (!service) return { ok: false, errorCode: "service_not_found" }

  return withCompliance(
    {
      action: "case.created",
      resourceType: "cases",
      userId: user.id,
      metadata: { serviceSlug: parsed.data.serviceSlug },
    },
    async (): Promise<CreateCaseResult> => {
      const { data: row, error } = await supabase
        .from("cases")
        .insert({
          client_id: user.id,
          service_id: service.id,
          display_name: parsed.data.displayName,
          beneficiary_data: (parsed.data.beneficiary ?? null) as Json | null,
          intake_status: "created",
          agreed_price_cents: service.base_price_cents,
        })
        .select("id, case_number")
        .single()
      if (error || !row) {
        return { ok: false, errorCode: "generic", errorMessage: error?.message ?? "insert failed" }
      }

      await appendCaseActivity({
        caseId: row.id,
        actorId: user.id,
        actorType: "client",
        activityType: "case.created",
        description: `Caso creado: ${parsed.data.displayName}`,
        metadata: { case_number: row.case_number, service_slug: parsed.data.serviceSlug },
      })

      // Auto-generar contrato (terms_snapshot inmutable)
      const service2 = createServiceClient()
      await service2.from("contracts").insert({
        case_id: row.id,
        client_id: user.id,
        terms_snapshot: {
          serviceSlug: parsed.data.serviceSlug,
          priceCents: service.base_price_cents,
          refundPolicyDays: 7,
          generatedAt: new Date().toISOString(),
        } as Json,
        signature_status: "draft",
      })

      // Avanzar a contract_pending vía service role (RLS update permite client en
      // ciertos status, pero el server tiene autoridad)
      await service2.from("cases").update({ intake_status: "contract_pending" }).eq("id", row.id)

      return { ok: true, caseId: row.id }
    },
  )
}
