"use server"

import type { Route } from "next"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { maskEmail, withCompliance } from "@/server/compliance"
import { signInSchema } from "../schemas"

export interface SignInResult {
  ok: boolean
  errorCode?: "validation" | "invalid_credentials" | "rate_limited" | "generic"
  errorMessage?: string
}

export async function signInAction(formData: FormData): Promise<SignInResult> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })

  if (!parsed.success) {
    return { ok: false, errorCode: "validation", errorMessage: parsed.error.message }
  }

  const { email, password } = parsed.data
  const next = String(formData.get("next") ?? "")
  const locale = String(formData.get("locale") ?? "es")

  const result = await withCompliance(
    {
      action: "auth.sign_in",
      resourceType: "auth.user",
      piiAccessed: true,
      metadata: { emailMasked: maskEmail(email), emailDomain: email.split("@")[1] ?? "unknown" },
    },
    async (): Promise<SignInResult> => {
      const supabase = await createServerClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (/invalid login credentials/i.test(error.message)) {
          return { ok: false, errorCode: "invalid_credentials" }
        }
        if (/rate limit/i.test(error.message)) {
          return { ok: false, errorCode: "rate_limited" }
        }
        return { ok: false, errorCode: "generic", errorMessage: error.message }
      }
      return { ok: true }
    },
  )

  if (result.ok) {
    const target = next?.startsWith("/") ? next : `/${locale}/dashboard`
    redirect(target as Route)
  }
  return result
}
