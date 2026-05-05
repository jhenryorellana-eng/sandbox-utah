"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

export async function setLanguageAction(
  locale: "es" | "en",
): Promise<{ ok: boolean; errorMessage?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorMessage: "auth required" }

  return withCompliance(
    {
      action: "onboarding.language_set",
      resourceType: "profiles",
      resourceId: user.id,
      userId: user.id,
      metadata: { locale },
    },
    async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: locale })
        .eq("id", user.id)
      if (error) return { ok: false, errorMessage: error.message }
      return { ok: true }
    },
  )
}
