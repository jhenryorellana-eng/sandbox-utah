"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { ComplianceError, withCompliance } from "@/server/compliance"
import { buildSchedule } from "../schedule"

const inputSchema = z.object({
  caseId: z.string().uuid(),
  totalCents: z.number().int().positive(),
  paymentType: z.enum(["one_time", "installments"]),
  numInstallments: z.number().int().min(1).max(36).default(1),
  downPaymentCents: z.number().int().min(0).default(0),
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cadence: z.enum(["monthly", "biweekly", "weekly"]).default("monthly"),
  notes: z.string().optional(),
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

export interface CreatePlanResult {
  ok: boolean
  planId?: string
  errorCode?: "auth" | "not_admin" | "validation" | "case_not_found" | "generic"
  errorMessage?: string
}

export async function createPaymentPlanAction(input: unknown): Promise<CreatePlanResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }
  const adminId = await requireAdmin()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: "payment_plan.created",
      resourceType: "payment_plans",
      userId: adminId,
      metadata: {
        caseId: parsed.data.caseId,
        totalCents: parsed.data.totalCents,
        paymentType: parsed.data.paymentType,
      },
    },
    async (): Promise<CreatePlanResult> => {
      const service = createServiceClient()
      const { data: caseRow } = await service
        .from("cases")
        .select("id, client_id, intake_status")
        .eq("id", parsed.data.caseId)
        .maybeSingle()
      if (!caseRow) return { ok: false, errorCode: "case_not_found" }

      const { data: planRow, error: planErr } = await service
        .from("payment_plans")
        .insert({
          case_id: caseRow.id,
          client_id: caseRow.client_id,
          total_amount_cents: parsed.data.totalCents,
          payment_type: parsed.data.paymentType,
          num_installments: parsed.data.numInstallments,
          down_payment_cents: parsed.data.downPaymentCents,
          notes: parsed.data.notes ?? null,
          created_by: adminId,
        })
        .select("id")
        .single()
      if (planErr || !planRow) {
        return { ok: false, errorCode: "generic", errorMessage: planErr?.message }
      }

      const schedule = buildSchedule({
        totalCents: parsed.data.totalCents,
        paymentType: parsed.data.paymentType,
        numInstallments: parsed.data.numInstallments,
        downPaymentCents: parsed.data.downPaymentCents,
        firstDueDate: new Date(parsed.data.firstDueDate),
        cadence: parsed.data.cadence,
      })

      const { error: instErr } = await service.from("installments").insert(
        schedule.map((s) => ({
          payment_plan_id: planRow.id,
          installment_number: s.installmentNumber,
          amount_cents: s.amountCents,
          due_date: s.dueDate,
        })),
      )
      if (instErr) {
        throw new ComplianceError(`installments insert failed: ${instErr.message}`, "db_error")
      }

      // Avanza caso a payment_pending si está en contract_signed
      if (caseRow.intake_status === "contract_signed") {
        await service
          .from("cases")
          .update({ intake_status: "payment_pending", payment_plan_type: parsed.data.paymentType })
          .eq("id", caseRow.id)
      }

      await appendCaseActivity({
        caseId: caseRow.id,
        actorId: adminId,
        actorType: "admin",
        activityType: "payment_plan.created",
        description: `Plan de pagos creado: ${parsed.data.paymentType}, ${schedule.length} cuotas`,
        metadata: { planId: planRow.id },
      })

      revalidatePath(`/admin/cases/${caseRow.id}`)
      revalidatePath(`/cases/${caseRow.id}/payments`)
      return { ok: true, planId: planRow.id }
    },
  )
}
