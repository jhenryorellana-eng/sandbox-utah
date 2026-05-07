"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { submitVerificationAction } from "../actions/submit-verification"

export function ResidencyUploadStep({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("Onboarding.steps.residency")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await submitVerificationAction(formData)
      if (!res.ok) {
        if (res.errorCode === "file_too_large") setError(t("fileTooLarge"))
        else if (res.errorCode === "invalid_type") setError(t("invalidType"))
        else setError(res.errorMessage ?? "Error")
        return
      }
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-normal">{t("submittedTitle")}</h2>
        <p className="text-muted-foreground">{t("submittedBody")}</p>
        <Button type="button" onClick={onSuccess} className="self-start">
          OK
        </Button>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{t("title")}</h2>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="front">{t("uploadFront")}</Label>
        <input
          id="front"
          name="front"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="back">{t("uploadBack")}</Label>
        <input
          id="back"
          name="back"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof">{t("uploadProof")}</Label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">{t("uploadProofHint")}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
