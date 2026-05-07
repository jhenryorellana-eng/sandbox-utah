"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function TutorialStep({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("Onboarding.steps.tutorial")
  const tNav = useTranslations("Onboarding")
  const steps = ["step1", "step2", "step3", "step4", "step5"] as const

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-normal">{t("title")}</h2>
      </header>
      <ol className="space-y-3">
        {steps.map((key, idx) => (
          <li key={key} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {idx + 1}
            </span>
            <p className="text-sm leading-relaxed">{t(key)}</p>
          </li>
        ))}
      </ol>
      <Button type="button" onClick={onSuccess} className="self-start">
        {tNav("next")}
      </Button>
    </div>
  )
}
