import "server-only"

/**
 * Wrapper minimal sobre la API REST de Resend.
 *
 * Usamos fetch directo (no SDK) por dos razones:
 *   1. Evitar instalar `resend` solo para una API tan simple.
 *   2. El SDK de Resend a veces incluye dependencies de Node que rompen Edge.
 *
 * Si la env var `RESEND_API_KEY` no está configurada, los envíos quedan en
 * modo "dry-run" — log a console pero no se envía. Esto permite levantar
 * dev sin Resend configurado.
 */

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  errorMessage?: string
  dryRun?: boolean
}

const DEFAULT_FROM = "USA Latino Prime Utah <noreply@usalatinoprime.com>"

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[resend] RESEND_API_KEY missing — dry-run mode", {
      to: input.to,
      subject: input.subject,
    })
    return { ok: true, dryRun: true }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from ?? DEFAULT_FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo,
      tags: input.tags,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    console.error("[resend] send failed", response.status, text)
    return { ok: false, errorMessage: `${response.status} ${text}` }
  }

  const data = (await response.json()) as { id?: string }
  return data.id ? { ok: true, id: data.id } : { ok: true }
}
