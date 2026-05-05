"use server"

import type { Route } from "next"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "es")

  await withCompliance({ action: "auth.sign_out", resourceType: "auth.user" }, async () => {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
  })

  redirect(`/${locale}` as Route)
}
