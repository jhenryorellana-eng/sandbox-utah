import { NextResponse } from "next/server"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServiceClient } from "@/lib/supabase/server"
import { auditLog } from "@/server/compliance"
import { verifyWebhookSignature } from "@/server/integrations/dropbox-sign/client"

interface DropboxSignWebhookPayload {
  event: {
    event_type:
      | "signature_request_sent"
      | "signature_request_viewed"
      | "signature_request_signed"
      | "signature_request_all_signed"
      | "signature_request_declined"
    event_hash?: string
  }
  signature_request: {
    signature_request_id: string
    metadata?: { case_id?: string }
  }
}

export async function POST(request: Request) {
  const text = await request.text()
  const formData = new URLSearchParams(text)
  const json = formData.get("json")
  if (!json) return NextResponse.json({ error: "missing json" }, { status: 400 })

  const sig = request.headers.get("x-dropbox-sign-signature") ?? ""
  const valid = await verifyWebhookSignature(json, sig)
  if (!valid) {
    await auditLog.write({
      action: "webhook.dropbox_sign.invalid_signature",
      phase: "blocked",
    })
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  let payload: DropboxSignWebhookPayload
  try {
    payload = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }

  const eventType = payload.event.event_type
  const requestId = payload.signature_request.signature_request_id
  const caseId = payload.signature_request.metadata?.case_id

  await auditLog.write({
    action: `webhook.dropbox_sign.${eventType}`,
    phase: "completed",
    resourceType: "contracts",
    resourceId: requestId,
    metadata: caseId ? { caseId } : {},
  })

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  if (eventType === "signature_request_signed" || eventType === "signature_request_all_signed") {
    await supabase
      .from("contracts")
      .update({ signature_status: "signed", signed_at: now })
      .eq("dropbox_sign_request_id", requestId)
    if (caseId) {
      await supabase.from("cases").update({ intake_status: "contract_signed" }).eq("id", caseId)
      await appendCaseActivity({
        caseId,
        actorId: null,
        actorType: "system",
        activityType: "contract.signed_via_webhook",
        description: "Contrato firmado vía Dropbox Sign webhook",
      })
    }
  } else if (eventType === "signature_request_declined") {
    await supabase
      .from("contracts")
      .update({ signature_status: "declined" })
      .eq("dropbox_sign_request_id", requestId)
  } else if (eventType === "signature_request_viewed") {
    await supabase
      .from("contracts")
      .update({ signature_status: "viewed" })
      .eq("dropbox_sign_request_id", requestId)
  }

  // Dropbox Sign requiere que devolvamos exactamente "Hello API Event Received"
  return new NextResponse("Hello API Event Received", { status: 200 })
}
