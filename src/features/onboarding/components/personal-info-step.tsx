"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePersonalInfoAction } from "../actions/update-personal-info"

export function PersonalInfoStep({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("Onboarding.steps.personal")
  const tNav = useTranslations("Onboarding")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await updatePersonalInfoAction(formData)
      if (!res.ok) {
        if (res.errorCode === "underage") setError(t("errors.underage"))
        else if (res.errorCode === "invalid_dob") setError(t("errors.invalidDob"))
        else setError(res.errorMessage ?? "Error")
        return
      }
      onSuccess()
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{t("title")}</h2>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fields.fullName")}</Label>
        <Input id="fullName" name="fullName" required minLength={2} autoComplete="name" />
        <p className="text-xs text-muted-foreground">{t("fields.fullNameHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">{t("fields.dateOfBirth")}</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required autoComplete="bday" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("fields.phone")}</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        <p className="text-xs text-muted-foreground">{t("fields.phoneHint")}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "..." : tNav("next")}
      </Button>
    </form>
  )
}
