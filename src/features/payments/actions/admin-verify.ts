"use server"

import { revalidatePath } from "next/cache"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { ComplianceError, withCompliance } from "@/server/compliance"
import { sendEmail } from "@/server/integrations/resend/client"

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

export interface VerifyPaymentResult {
  ok: boolean
  errorCode?: "auth" | "not_admin" | "not_found" | "wrong_status" | "generic"
  errorMessage?: string
}

export async function verifyPaymentAction(
  paymentId: string,
  notes?: string,
): Promise<VerifyPaymentResult> {
  const adminId = await requireAdmin()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: "payment.verified",
      resourceType: "payments",
      resourceId: paymentId,
      userId: adminId,
    },
    async (): Promise<VerifyPaymentResult> => {
      const service = createServiceClient()
      const { data: payment } = await service
        .from("payments")
        .select(
          "*, installment:installments(id, payment_plan_id), client:profiles!payments_client_id_fkey(email, preferred_language)",
        )
        .eq("id", paymentId)
        .maybeSingle()
      const inst = (
        payment as unknown as { installment: { id: string; payment_plan_id: string } | null } | null
      )?.installment
      const client = (
        payment as unknown as {
          client: { email: string; preferred_language: "es" | "en" } | null
        } | null
      )?.client
      if (!payment || payment.status !== "reported") {
        return { ok: false, errorCode: "wrong_status" }
      }

      const now = new Date().toISOString()
      const { error: pErr } = await service
        .from("payments")
        .update({
          status: "verified",
          verified_by: adminId,
          verified_at: now,
          verification_notes: notes ?? null,
        })
        .eq("id", paymentId)
      if (pErr) return { ok: false, errorCode: "generic", errorMessage: pErr.message }

      if (inst) {
        await service
          .from("installments")
          .update({ status: "verified", payment_id: paymentId })
          .eq("id", inst.id)

        // Si todas las cuotas verificadas → plan completed; primera cuota → caso a in_progress
        const { data: pendingCount } = await service
          .from("installments")
          .select("id", { count: "exact", head: true })
          .eq("payment_plan_id", inst.payment_plan_id)
          .neq("status", "verified")
        if (pendingCount === null) {
          await service
            .from("payment_plans")
            .update({ status: "completed" })
            .eq("id", inst.payment_plan_id)
        }
      }

      // Generar receipt PDF (placeholder — Sprint 7+ usa pdf-lib real)
      await service.from("payment_receipts").insert({
        payment_id: paymentId,
        pdf_storage_path: null,
        emailed_to: client?.email ?? null,
        emailed_at: now,
      })

      await appendCaseActivity({
        caseId: payment.case_id,
        actorId: adminId,
        actorType: "admin",
        activityType: "payment.verified",
        description: `Pago verificado por admin (${payment.payment_method})`,
        metadata: { paymentId, amountCents: payment.amount_cents },
      })

      // Email al cliente
      if (client?.email) {
        await sendEmail({
          to: client.email,
          subject: client.preferred_language === "en" ? "Payment confirmed" : "Pago confirmado",
          html:
            client.preferred_language === "en"
              ? `<p>Your payment of $${(payment.amount_cents / 100).toFixed(2)} has been verified.</p>`
              : `<p>Tu pago de $${(payment.amount_cents / 100).toFixed(2)} ha sido verificado.</p>`,
        })
      }

      revalidatePath("/admin/payments")
      revalidatePath(`/cases/${payment.case_id}/payments`)
      return { ok: true }
    },
  )
}

export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
): Promise<VerifyPaymentResult> {
  if (!reason.trim()) return { ok: false, errorCode: "wrong_status" }
  const adminId = await requireAdmin()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: "payment.rejected",
      resourceType: "payments",
      resourceId: paymentId,
      userId: adminId,
      metadata: { reasonLength: reason.length },
    },
    async (): Promise<VerifyPaymentResult> => {
      const service = createServiceClient()
      const { data: payment } = await service
        .from("payments")
        .select("*, installment:installments(id)")
        .eq("id", paymentId)
        .maybeSingle()
      if (!payment) throw new ComplianceError("payment not found", "not_found")

      const { error } = await service
        .from("payments")
        .update({
          status: "rejected",
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", paymentId)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      const inst = (payment as unknown as { installment: { id: string } | null }).installment
      if (inst) {
        await service
          .from("installments")
          .update({ status: "pending", payment_id: null })
          .eq("id", inst.id)
      }

      await appendCaseActivity({
        caseId: payment.case_id,
        actorId: adminId,
        actorType: "admin",
        activityType: "payment.rejected",
        description: `Pago rechazado: ${reason}`,
        metadata: { paymentId },
      })

      revalidatePath("/admin/payments")
      revalidatePath(`/cases/${payment.case_id}/payments`)
      return { ok: true }
    },
  )
}
