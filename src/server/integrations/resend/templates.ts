import "server-only"
import type { Locale } from "@/lib/i18n/routing"

/**
 * Templates de email transaccional bilingües. HTML inline minimal (sin
 * frameworks tipo react-email) — suficiente para confirmación, verificación
 * de identidad y notificaciones del sandbox.
 *
 * Cada template incluye el complaint banner del sandbox (REQUERIMIENTOS §6.2).
 */

const COMPLAINT_URL = "https://utahinnovationoffice.org/sandbox-customer-complaint/"

function shell(content: string, footer: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>USA Latino Prime Utah</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;margin:0;padding:24px;color:#0d2540"><table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb"><tr><td style="padding:24px">${content}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"><p style="font-size:12px;color:#6b7280;line-height:1.4">${footer}</p></td></tr></table></body></html>`
}

const FOOTER_ES = `Esta entidad opera bajo el Utah Legal Regulatory Sandbox. Reporta quejas a soporte@usalatinoprime.com o directamente al Utah Office of Legal Services Innovation: <a href="${COMPLAINT_URL}" style="color:#0d2540">${COMPLAINT_URL}</a><br><br><em>Esto NO es un bufete de abogados. Algunas personas que administran esta compañía no son abogados.</em>`

const FOOTER_EN = `This entity operates under the Utah Legal Regulatory Sandbox. Report complaints to soporte@usalatinoprime.com or directly to the Utah Office of Legal Services Innovation: <a href="${COMPLAINT_URL}" style="color:#0d2540">${COMPLAINT_URL}</a><br><br><em>This is NOT a law firm. Some people who manage this company are not lawyers.</em>`

export function welcomeEmail(locale: Locale, name: string): { subject: string; html: string } {
  if (locale === "en") {
    const html = shell(
      `<h1 style="margin:0 0 12px;font-size:22px">Welcome, ${escapeHtml(name)}</h1><p>Your account is now active. Next step: complete your onboarding so you can explore available services.</p>`,
      FOOTER_EN,
    )
    return { subject: "Welcome to USA Latino Prime Utah", html }
  }
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:22px">Bienvenido, ${escapeHtml(name)}</h1><p>Tu cuenta está activa. Próximo paso: completa tu onboarding para que puedas explorar los servicios disponibles.</p>`,
    FOOTER_ES,
  )
  return { subject: "Bienvenido a USA Latino Prime Utah", html }
}

export function identityApprovedEmail(locale: Locale): { subject: string; html: string } {
  if (locale === "en") {
    const html = shell(
      `<h1 style="margin:0 0 12px;font-size:22px">Utah residency verified</h1><p>Your identity verification was approved. You can now start a case.</p>`,
      FOOTER_EN,
    )
    return { subject: "Utah residency verified", html }
  }
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:22px">Residencia Utah verificada</h1><p>Tu verificación de identidad fue aprobada. Ya puedes iniciar un caso.</p>`,
    FOOTER_ES,
  )
  return { subject: "Residencia Utah verificada", html }
}

export function identityRejectedEmail(
  locale: Locale,
  reason: string,
): { subject: string; html: string } {
  if (locale === "en") {
    const html = shell(
      `<h1 style="margin:0 0 12px;font-size:22px">Verification needs more info</h1><p>Reason: ${escapeHtml(reason)}</p><p>You can resubmit your documents from your dashboard.</p>`,
      FOOTER_EN,
    )
    return { subject: "Verification needs more info", html }
  }
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:22px">Verificación necesita más información</h1><p>Razón: ${escapeHtml(reason)}</p><p>Puedes volver a enviar tus documentos desde tu dashboard.</p>`,
    FOOTER_ES,
  )
  return { subject: "Verificación necesita más información", html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
