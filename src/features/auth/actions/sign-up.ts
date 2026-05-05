"use server"

import { createServerClient } from "@/lib/supabase/server"
import { maskEmail, withCompliance } from "@/server/compliance"
import { signUpSchema } from "../schemas"

export interface SignUpResult {
  ok: boolean
  errorCode?: "validation" | "email_taken" | "weak_password" | "rate_limited" | "generic"
  errorMessage?: string
  requiresEmailConfirmation?: boolean
}

export async function signUpAction(formData: FormData): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? "es"),
  })

  if (!parsed.success) {
    return { ok: false, errorCode: "validation", errorMessage: parsed.error.message }
  }

  const { email, password, fullName, preferredLanguage } = parsed.data
  const emailDomain = email.split("@")[1] ?? "unknown"

  return withCompliance(
    {
      action: "auth.sign_up",
      resourceType: "auth.user",
      piiAccessed: true,
      metadata: { emailMasked: maskEmail(email), emailDomain, locale: preferredLanguage },
    },
    async () => {
      const supabase = await createServerClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, preferred_language: preferredLanguage },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/${preferredLanguage}/dashboard`,
        },
      })

      if (error) {
        if (/already registered/i.test(error.message)) {
          return { ok: false, errorCode: "email_taken" as const, errorMessage: error.message }
        }
        if (/weak password/i.test(error.message)) {
          return { ok: false, errorCode: "weak_password" as const, errorMessage: error.message }
        }
        if (/rate limit/i.test(error.message)) {
          return { ok: false, errorCode: "rate_limited" as const, errorMessage: error.message }
        }
        return { ok: false, errorCode: "generic" as const, errorMessage: error.message }
      }

      return {
        ok: true,
        requiresEmailConfirmation: !data.session,
      }
    },
  )
}
