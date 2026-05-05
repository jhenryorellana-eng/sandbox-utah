import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { auditLog, maskEmail } from "@/server/compliance"

/**
 * Supabase email-verification callback.
 *
 * Flujo:
 *   1. Email contiene link `?code=...&next=/es/dashboard`.
 *   2. Aquí intercambiamos `code` por una sesión.
 *   3. Redirigimos al `next` (con locale apropiado) o a `/es/dashboard` si falta.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? ""

  if (!code) {
    return NextResponse.redirect(`${origin}/es/login?error=missing_code`)
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    await auditLog.write({
      action: "auth.email_callback",
      phase: "failed",
      metadata: { error: error.message },
    })
    return NextResponse.redirect(`${origin}/es/login?error=${encodeURIComponent(error.message)}`)
  }

  await auditLog.write({
    action: "auth.email_confirmed",
    phase: "completed",
    userId: data.user?.id ?? null,
    piiAccessed: true,
    metadata: data.user?.email ? { emailMasked: maskEmail(data.user.email) } : {},
  })

  // Validar que el `next` sea un path interno (mitigación open-redirect).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/es/dashboard"
  return NextResponse.redirect(`${origin}${safeNext}`)
}
