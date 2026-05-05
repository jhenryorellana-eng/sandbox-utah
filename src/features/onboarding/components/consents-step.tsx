"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Locale } from "@/lib/i18n/routing"
import { recordConsentsAction } from "../actions/record-consents"

const KEYS = [
  "is_utah_resident",
  "not_a_law_firm",
  "no_legal_advice",
  "no_immigration",
  "accuracy_responsibility",
  "ai_usage",
  "complaint_rights",
  "tos_privacy",
] as const

type ConsentKey = (typeof KEYS)[number]

interface ConsentItem {
  version: string
  text: string
}

export function ConsentsStep({
  locale,
  consents,
  onSuccess,
}: {
  locale: Locale
  consents: Record<ConsentKey, ConsentItem>
  onSuccess: () => void
}) {
  const t = useTranslations("Onboarding")
  const tStep = useTranslations("Onboarding.steps.consents")
  const tConsents = useTranslations("Consents")

  const [accepted, setAccepted] = useState<Record<ConsentKey, boolean>>(
    Object.fromEntries(KEYS.map((k) => [k, false])) as Record<ConsentKey, boolean>,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const allAccepted = KEYS.every((k) => accepted[k])

  function toggle(key: ConsentKey) {
    setAccepted((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function onSubmit() {
    if (!allAccepted) {
      setError(tConsents("errorMustAcceptAll"))
      return
    }
    setError(null)
    startTransition(async () => {
      const payload = KEYS.map((key) => ({
        key,
        version: consents[key].version,
        textSnapshot: consents[key].text,
        locale,
      }))
      const res = await recordConsentsAction(payload)
      if (!res.ok) {
        setError(res.errorMessage ?? "Error")
        return
      }
      onSuccess()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{tStep("title")}</h2>
        <p className="mt-1 text-muted-foreground">{tStep("subtitle")}</p>
      </header>

      <ul className="space-y-3">
        {KEYS.map((key) => (
          <li key={key} className="flex items-start gap-3 rounded-md border border-border p-3">
            <Checkbox
              id={`consent-${key}`}
              checked={accepted[key]}
              onCheckedChange={() => toggle(key)}
            />
            <Label htmlFor={`consent-${key}`} className="cursor-pointer text-sm leading-relaxed">
              {consents[key].text}
            </Label>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="button" disabled={pending || !allAccepted} onClick={onSubmit}>
        {pending ? "..." : t("next")}
      </Button>
    </div>
  )
}
