"use server"

import { z } from "zod"
import { buildTermsSnapshotV2 } from "@/features/contracts/snapshot-schema"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import type { Json } from "@/shared/types/database"
import { appendCaseActivity } from "../repository"

const minorInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "fecha en formato YYYY-MM-DD")
    .nullish(),
  documentNumber: z.string().max(40).nullish(),
})

const createCaseInput = z.object({
  serviceSlug: z.string().min(2),
  displayName: z.string().min(2).max(120),
  tierId: z.string().uuid().nullish(),
  minors: z.array(minorInputSchema).optional(),
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
  errorCode?:
    | "auth"
    | "validation"
    | "service_not_found"
    | "tier_required"
    | "tier_mismatch"
    | "minors_count_mismatch"
    | "residency_required"
    | "generic"
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
    .select("id, base_price_cents, allows_multiple_beneficiaries, slug")
    .eq("slug", parsed.data.serviceSlug)
    .eq("is_active", true)
    .maybeSingle()
  if (!service) return { ok: false, errorCode: "service_not_found" }

  let tierRow: {
    id: string
    service_id: string
    beneficiaries_count: number
    price_cents: number
    label_es: string
    label_en: string
  } | null = null
  if (service.allows_multiple_beneficiaries) {
    if (!parsed.data.tierId) return { ok: false, errorCode: "tier_required" }
    const { data: tier } = await supabase
      .from("service_tiers")
      .select("id, service_id, beneficiaries_count, price_cents, label_es, label_en")
      .eq("id", parsed.data.tierId)
      .eq("is_active", true)
      .maybeSingle()
    if (!tier || tier.service_id !== service.id) {
      return { ok: false, errorCode: "tier_mismatch" }
    }
    const minorsLen = parsed.data.minors?.length ?? 0
    if (minorsLen !== tier.beneficiaries_count) {
      return { ok: false, errorCode: "minors_count_mismatch" }
    }
    tierRow = tier
  }

  return withCompliance(
    {
      action: "case.created",
      resourceType: "cases",
      userId: user.id,
      metadata: {
        serviceSlug: parsed.data.serviceSlug,
        tierId: tierRow?.id ?? null,
        beneficiariesCount: tierRow?.beneficiaries_count ?? null,
      },
    },
    async (): Promise<CreateCaseResult> => {
      const agreedPriceCents = tierRow?.price_cents ?? service.base_price_cents
      const beneficiaryCount = tierRow?.beneficiaries_count ?? null

      const { data: row, error } = await supabase
        .from("cases")
        .insert({
          client_id: user.id,
          service_id: service.id,
          service_tier_id: tierRow?.id ?? null,
          beneficiary_count: beneficiaryCount,
          display_name: parsed.data.displayName,
          beneficiary_data: (parsed.data.beneficiary ?? null) as Json | null,
          intake_status: "created",
          agreed_price_cents: agreedPriceCents,
        })
        .select("id, case_number")
        .single()
      if (error || !row) {
        return { ok: false, errorCode: "generic", errorMessage: error?.message ?? "insert failed" }
      }

      const serviceRole = createServiceClient()

      // Insert case_minors si aplica
      const minorsForSnapshot: Array<{
        displayIndex: number
        fullName: string
        dateOfBirth?: string | null
      }> = []
      if (tierRow && parsed.data.minors && parsed.data.minors.length > 0) {
        const minorsRows = parsed.data.minors.map((m, i) => ({
          case_id: row.id,
          display_index: i + 1,
          full_name: m.fullName.trim(),
          date_of_birth: m.dateOfBirth ?? null,
          document_number: m.documentNumber ?? null,
        }))
        const { error: minorsErr } = await serviceRole.from("case_minors").insert(minorsRows)
        if (minorsErr) {
          await serviceRole.from("cases").delete().eq("id", row.id)
          return { ok: false, errorCode: "generic", errorMessage: minorsErr.message }
        }
        minorsForSnapshot.push(
          ...parsed.data.minors.map((m, i) => ({
            displayIndex: i + 1,
            fullName: m.fullName.trim(),
            dateOfBirth: m.dateOfBirth ?? null,
          })),
        )
      }

      const snapshot = buildTermsSnapshotV2({
        serviceSlug: parsed.data.serviceSlug,
        priceCents: agreedPriceCents,
        refundPolicyDays: 7,
        tier: tierRow
          ? {
              id: tierRow.id,
              beneficiariesCount: tierRow.beneficiaries_count,
              label_es: tierRow.label_es,
              label_en: tierRow.label_en,
              priceCents: tierRow.price_cents,
            }
          : null,
        minors: minorsForSnapshot,
      })

      await serviceRole.from("contracts").insert({
        case_id: row.id,
        client_id: user.id,
        terms_snapshot: snapshot as unknown as Json,
        signature_status: "draft",
      })

      await serviceRole.from("cases").update({ intake_status: "contract_pending" }).eq("id", row.id)

      await appendCaseActivity({
        caseId: row.id,
        actorId: user.id,
        actorType: "client",
        activityType: "case.created",
        description: `Caso creado: ${parsed.data.displayName}`,
        metadata: {
          case_number: row.case_number,
          service_slug: parsed.data.serviceSlug,
          tier_id: tierRow?.id ?? null,
          beneficiaries_count: tierRow?.beneficiaries_count ?? null,
        },
      })

      return { ok: true, caseId: row.id }
    },
  )
}
