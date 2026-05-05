"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const inputSchema = z.object({
  installmentId: z.string().uuid(),
  paymentMethod: z.enum([
    "cash",
    "zelle",
    "bank_transfer",
    "check",
    "money_order",
    "cashapp",
    "venmo",
    "other",
  ]),
  paymentMethodDetails: z.string().max(500).optional(),
  amountCents: z.number().int().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const
const MAX_BYTES = 10 * 1024 * 1024

export interface ReportPaymentResult {
  ok: boolean
  paymentId?: string
  errorCode?:
    | "auth"
    | "validation"
    | "installment_not_found"
    | "no_proof"
    | "file_too_large"
    | "invalid_type"
    | "generic"
  errorMessage?: string
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error("WebCrypto unavailable")
  const hash = await subtle.digest("SHA-256", buf)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function reportPaymentAction(formData: FormData): Promise<ReportPaymentResult> {
  const parsed = inputSchema.safeParse({
    installmentId: String(formData.get("installmentId") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    paymentMethodDetails: String(formData.get("paymentMethodDetails") ?? "") || undefined,
    amountCents: Number(formData.get("amountCents") ?? 0),
    paymentDate: String(formData.get("paymentDate") ?? ""),
  })
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const proof = formData.get("proof")
  if (!(proof instanceof File) || proof.size === 0) {
    return { ok: false, errorCode: "no_proof" }
  }
  if (proof.size > MAX_BYTES) return { ok: false, errorCode: "file_too_large" }
  if (!ALLOWED_TYPES.includes(proof.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, errorCode: "invalid_type" }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: installment } = await supabase
    .from("installments")
    .select("*, payment_plan:payment_plans(case_id, client_id)")
    .eq("id", parsed.data.installmentId)
    .maybeSingle()
  const plan = (
    installment as unknown as {
      payment_plan: { case_id: string; client_id: string } | null
    } | null
  )?.payment_plan
  if (!installment || !plan || plan.client_id !== user.id) {
    return { ok: false, errorCode: "installment_not_found" }
  }

  return withCompliance(
    {
      action: "payment.reported",
      resourceType: "payments",
      userId: user.id,
      metadata: {
        installmentId: parsed.data.installmentId,
        method: parsed.data.paymentMethod,
        amountCents: parsed.data.amountCents,
      },
    },
    async (): Promise<ReportPaymentResult> => {
      const { data: paymentRow, error: insErr } = await supabase
        .from("payments")
        .insert({
          payment_plan_id: installment.payment_plan_id,
          installment_id: installment.id,
          client_id: user.id,
          case_id: plan.case_id,
          amount_cents: parsed.data.amountCents,
          payment_method: parsed.data.paymentMethod,
          payment_method_details: parsed.data.paymentMethodDetails ?? null,
          payment_date: parsed.data.paymentDate,
          status: "reported",
          reported_by: user.id,
          reported_by_role: "client",
        })
        .select("id")
        .single()
      if (insErr || !paymentRow) {
        return { ok: false, errorCode: "generic", errorMessage: insErr?.message }
      }

      const arrayBuffer = await proof.arrayBuffer()
      const hash = await sha256Hex(arrayBuffer)
      const ext = guessExtension(proof.type) ?? "bin"
      const path = `${user.id}/${plan.case_id}/${paymentRow.id}.${ext}`

      const service = createServiceClient()
      const { error: upErr } = await service.storage
        .from("payment-proofs")
        .upload(path, arrayBuffer, { contentType: proof.type, upsert: true })
      if (upErr) return { ok: false, errorCode: "generic", errorMessage: upErr.message }

      await service.from("payment_proofs").insert({
        payment_id: paymentRow.id,
        storage_path: path,
        filename: proof.name,
        mime_type: proof.type,
        size_bytes: proof.size,
        sha256_hash: hash,
        uploaded_by: user.id,
      })

      await service.from("installments").update({ status: "reported" }).eq("id", installment.id)

      await appendCaseActivity({
        caseId: plan.case_id,
        actorId: user.id,
        actorType: "client",
        activityType: "payment.reported",
        description: `Cliente reportó pago: ${parsed.data.paymentMethod}`,
        metadata: { paymentId: paymentRow.id, amountCents: parsed.data.amountCents },
      })

      revalidatePath(`/cases/${plan.case_id}/payments`)
      revalidatePath("/admin/payments")
      return { ok: true, paymentId: paymentRow.id }
    },
  )
}

function guessExtension(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "application/pdf":
      return "pdf"
    default:
      return null
  }
}
