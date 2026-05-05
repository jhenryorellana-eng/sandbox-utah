import { type NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/lib/i18n/routing"
import { updateSession } from "@/lib/supabase/middleware"

const intlMiddleware = createIntlMiddleware(routing)

const PROTECTED_PATTERNS = [
  /^\/(es|en)\/dashboard(\/|$)/,
  /^\/(es|en)\/cases(\/|$)/,
  /^\/(es|en)\/settings(\/|$)/,
  /^\/(es|en)\/admin(\/|$)/,
]

const AUTH_PATTERNS = [/^\/(es|en)\/login(\/|$)/, /^\/(es|en)\/register(\/|$)/]

export async function proxy(request: NextRequest) {
  // 1) i18n primero — produce rewrites/redirects para locale.
  const intlResponse = intlMiddleware(request)

  // 2) Refrescar la sesión Supabase EN LA MISMA response.
  //    No sustituir intlResponse por una nueva — perderíamos el rewrite.
  const { response, userId } = await updateSession(request, intlResponse)

  const pathname = request.nextUrl.pathname
  const locale: "es" | "en" = pathname.startsWith("/en") ? "en" : "es"

  // 3) Auth gate.
  if (PROTECTED_PATTERNS.some((re) => re.test(pathname)) && !userId) {
    const url = new URL(`/${locale}/login`, request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // 4) Si ya autenticado, redirigir login/register al dashboard.
  if (AUTH_PATTERNS.some((re) => re.test(pathname)) && userId) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
