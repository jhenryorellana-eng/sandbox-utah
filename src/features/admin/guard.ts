import "server-only"
import { redirect } from "next/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Server-side guard que verifica que el usuario actual tiene rol admin.
 * Redirige a /{locale}/login o /{locale}/dashboard según el caso.
 * Llamar al inicio de cada page admin.
 */
export async function requireAdmin(locale: Locale): Promise<{ userId: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (error || !data) redirect(`/${locale}/dashboard`)

  return { userId: user.id }
}
