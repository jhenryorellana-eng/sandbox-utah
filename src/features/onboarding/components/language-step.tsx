"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n/routing"
import { setLanguageAction } from "../actions/set-language"

export function LanguageStep({ current, onSuccess }: { current: Locale; onSuccess: () => void }) {
  const t = useTranslations("Onboarding.steps.language")
  const [selected, setSelected] = useState<Locale>(current)
  const [pending, startTransition] = useTransition()

  function onSubmit() {
    startTransition(async () => {
      await setLanguageAction(selected)
      onSuccess()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-normal">{t("title")}</h2>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["es", "en"] as const).map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setSelected(loc)}
            aria-pressed={selected === loc}
            className={`rounded-md border p-4 text-left transition ${
              selected === loc
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary/30"
            }`}
          >
            <span className="block font-medium">{loc === "es" ? t("spanish") : t("english")}</span>
            <span className="text-sm text-muted-foreground">{loc.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <Button type="button" onClick={onSubmit} disabled={pending} className="self-start">
        {pending ? "..." : t("title")}
      </Button>
    </div>
  )
}
