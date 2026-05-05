"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { type SignUpResult, signUpAction } from "../actions/sign-up"

export function SignUpForm({ locale }: { locale: Locale }) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    formData.set("preferredLanguage", locale)

    startTransition(async () => {
      const result: SignUpResult = await signUpAction(formData)
      if (!result.ok) {
        const code = result.errorCode ?? "generic"
        const messageKey = (
          {
            email_taken: "errors.emailTaken",
            weak_password: "errors.weakPassword",
            rate_limited: "errors.rateLimited",
            validation: "errors.invalidEmail",
            generic: "errors.generic",
          } as const
        )[code]
        setError(t(messageKey))
        return
      }
      const email = String(formData.get("email") ?? "")
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fields.fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          minLength={2}
          placeholder={t("fields.fullNamePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("fields.emailPlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("fields.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t("fields.passwordPlaceholder")}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.submitting") : t("actions.signUp")}
      </Button>
    </form>
  )
}
