"use server"

import { revalidatePath } from "next/cache"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { createSignatureRequest } from "@/server/integrations/dropbox-sign/client"

export interface SendForSignatureResult {
  ok: boolean
  signingUrl?: string
  errorCode?: "auth" | "not_found" | "wrong_status" | "generic"
  errorMessage?: string
}

export async function sendContractForSignatureAction(
  caseId: string,
): Promise<SendForSignatureResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: contract } = await supabase
    .from("contracts")
    .select("*, case:cases(intake_status)")
    .eq("case_id", caseId)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!contract) return { ok: false, errorCode: "not_found" }

  if (contract.signature_status !== "draft" && contract.signature_status !== "sent") {
    return { ok: false, errorCode: "wrong_status" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  return withCompliance(
    {
      action: "contract.send_for_signature",
      resourceType: "contracts",
      resourceId: contract.id,
      userId: user.id,
      piiAccessed: true,
    },
    async (): Promise<SendForSignatureResult> => {
      const result = await createSignatureRequest({
        contractNumber: contract.contract_number,
        signerEmail: profile?.email ?? user.email ?? "",
        signerName: profile?.full_name ?? "Client",
        pdfBase64: "JVBERi0xLjQKJ...", // PDF stub placeholder Sprint 7+
        metadata: { case_id: caseId, contract_number: contract.contract_number },
      })

      if (!result.ok) {
        return result.errorMessage
          ? { ok: false, errorCode: "generic", errorMessage: result.errorMessage }
          : { ok: false, errorCode: "generic" }
      }

      const service = createServiceClient()
      const { error } = await service
        .from("contracts")
        .update({
          signature_status: "sent",
          dropbox_sign_request_id: result.signatureRequestId ?? null,
        })
        .eq("id", contract.id)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      await appendCaseActivity({
        caseId,
        actorId: user.id,
        actorType: "client",
        activityType: "contract.sent_for_signature",
        description: "Contrato enviado a Dropbox Sign",
        metadata: { contract_number: contract.contract_number, stub: result.stub ?? false },
      })

      revalidatePath(`/cases/${caseId}`)
      const out: SendForSignatureResult = { ok: true }
      if (result.signingUrl) out.signingUrl = result.signingUrl
      return out
    },
  )
}

/**
 * STUB action que confirma firma (cuando no hay Dropbox Sign en dev).
 * En producción, el webhook lo hace automáticamente.
 */
export async function confirmStubSignatureAction(caseId: string): Promise<SendForSignatureResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  return withCompliance(
    {
      action: "contract.stub_signed",
      resourceType: "contracts",
      userId: user.id,
      metadata: { caseId, environment: "dev" },
    },
    async (): Promise<SendForSignatureResult> => {
      const service = createServiceClient()
      const now = new Date().toISOString()

      const { data: contract } = await service
        .from("contracts")
        .select("id, signature_status")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!contract) return { ok: false, errorCode: "not_found" }

      await service
        .from("contracts")
        .update({ signature_status: "signed", signed_at: now })
        .eq("id", contract.id)

      // Avanzar caso a contract_signed → payment_pending
      await service.from("cases").update({ intake_status: "contract_signed" }).eq("id", caseId)

      await appendCaseActivity({
        caseId,
        actorId: user.id,
        actorType: "client",
        activityType: "contract.signed",
        description: "Contrato firmado (stub)",
      })

      revalidatePath(`/cases/${caseId}`)
      return { ok: true }
    },
  )
}
