"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Locale } from "@/lib/i18n/routing"
import { type SignInResult, signInAction } from "../actions/sign-in"

export function SignInForm({ locale }: { locale: Locale }) {
  const t = useTranslations("Auth")
  const params = useSearchParams()
  const next = params.get("next") ?? ""

  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    formData.set("locale", locale)
    if (next) formData.set("next", next)

    startTransition(async () => {
      const result: SignInResult = await signInAction(formData)
      if (!result.ok) {
        const code = result.errorCode ?? "generic"
        const messageKey = (
          {
            invalid_credentials: "errors.invalidCredentials",
            rate_limited: "errors.rateLimited",
            validation: "errors.invalidEmail",
            generic: "errors.generic",
          } as const
        )[code]
        setError(t(messageKey))
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          placeholder={t("fields.passwordPlaceholder")}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.submitting") : t("actions.signIn")}
      </Button>
    </form>
  )
}
