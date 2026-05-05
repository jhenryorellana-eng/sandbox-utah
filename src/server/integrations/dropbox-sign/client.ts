import "server-only"

/**
 * Wrapper minimal sobre Dropbox Sign (HelloSign) API. Igual que Resend, en
 * dev/test sin `DROPBOX_SIGN_API_KEY` corre en modo "stub" devolviendo IDs
 * fake — esto permite avanzar el flujo de contratos sin pagar API hasta que
 * se firme el contrato en producción.
 *
 * Docs: https://developers.hellosign.com/api/reference/operation/signatureRequestSendWithTemplate/
 */

export interface CreateSignatureRequestInput {
  contractNumber: string
  signerEmail: string
  signerName: string
  pdfBase64: string
  metadata?: Record<string, string>
}

export interface CreateSignatureRequestResult {
  ok: boolean
  signatureRequestId?: string
  signingUrl?: string
  errorMessage?: string
  stub?: boolean
}

export async function createSignatureRequest(
  input: CreateSignatureRequestInput,
): Promise<CreateSignatureRequestResult> {
  const apiKey = process.env.DROPBOX_SIGN_API_KEY
  if (!apiKey) {
    console.warn("[dropbox-sign] API key missing — stub mode", input.contractNumber)
    return {
      ok: true,
      stub: true,
      signatureRequestId: `stub_${input.contractNumber}_${Date.now()}`,
      signingUrl: `https://sign.example.com/stub/${input.contractNumber}`,
    }
  }

  const response = await fetch("https://api.hellosign.com/v3/signature_request/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `USA Latino Prime Utah — ${input.contractNumber}`,
      subject: `Firma tu contrato ${input.contractNumber}`,
      message: "Por favor firma este contrato para continuar con tu trámite.",
      signers: [{ email_address: input.signerEmail, name: input.signerName }],
      file: [input.pdfBase64],
      metadata: input.metadata,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return { ok: false, errorMessage: `${response.status} ${text}` }
  }

  const data = (await response.json()) as {
    signature_request: { signature_request_id: string; signing_url?: string }
  }
  const result: CreateSignatureRequestResult = {
    ok: true,
    signatureRequestId: data.signature_request.signature_request_id,
  }
  if (data.signature_request.signing_url) result.signingUrl = data.signature_request.signing_url
  return result
}

/**
 * Verifica HMAC del webhook (Dropbox Sign envía sha256 hex).
 * Si DROPBOX_SIGN_API_KEY ausente, acepta todo (modo dev/stub).
 */
export async function verifyWebhookSignature(
  body: string,
  receivedSignature: string,
): Promise<boolean> {
  const apiKey = process.env.DROPBOX_SIGN_API_KEY
  if (!apiKey) return true

  const subtle = globalThis.crypto?.subtle
  if (!subtle) return false
  const enc = new TextEncoder()
  const key = await subtle.importKey(
    "raw",
    enc.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await subtle.sign("HMAC", key, enc.encode(body))
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
  return timingSafeEqual(hex, receivedSignature)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
