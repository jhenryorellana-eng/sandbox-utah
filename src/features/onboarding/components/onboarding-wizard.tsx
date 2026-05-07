"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ResidencyUploadStep } from "@/features/identity/components/residency-upload-step"
import { useRouter } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { ONBOARDING_STEPS, type OnboardingStep } from "../state"
import { ConsentsStep } from "./consents-step"
import { LanguageStep } from "./language-step"
import { PersonalInfoStep } from "./personal-info-step"
import { TutorialStep } from "./tutorial-step"

interface ConsentItem {
  version: string
  text: string
}

export function OnboardingWizard({
  locale,
  consentTexts,
  startStep,
}: {
  locale: Locale
  consentTexts: Record<string, ConsentItem>
  startStep: OnboardingStep
}) {
  const t = useTranslations("Onboarding")
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>(startStep)
  const idx = ONBOARDING_STEPS.indexOf(step)

  function advance() {
    const next = ONBOARDING_STEPS[idx + 1]
    if (next) {
      setStep(next)
    } else {
      router.push("/dashboard")
    }
  }

  function goBack() {
    const prev = ONBOARDING_STEPS[idx - 1]
    if (prev) setStep(prev)
  }

  return (
    <Card className="w-full max-w-2xl animate-in-up">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <header className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            {t("stepOf", { step: idx + 1, total: ONBOARDING_STEPS.length })}
          </p>
          <ProgressBar current={idx + 1} total={ONBOARDING_STEPS.length} />
        </header>

        {step === "personal" && <PersonalInfoStep onSuccess={advance} />}
        {step === "residency" && <ResidencyUploadStep onSuccess={advance} />}
        {step === "consents" && (
          <ConsentsStep
            locale={locale}
            consents={consentTexts as Record<(typeof CONSENT_KEYS)[number], ConsentItem>}
            onSuccess={advance}
          />
        )}
        {step === "tutorial" && <TutorialStep onSuccess={advance} />}
        {step === "language" && <LanguageStep current={locale} onSuccess={advance} />}

        {idx > 0 && (
          <Button type="button" variant="ghost" onClick={goBack}>
            ← {t("back")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const CONSENT_KEYS = [
  "is_utah_resident",
  "not_a_law_firm",
  "no_legal_advice",
  "no_immigration",
  "accuracy_responsibility",
  "ai_usage",
  "complaint_rights",
  "tos_privacy",
] as const

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Onboarding progress"
      className="h-2 w-full overflow-hidden rounded-full bg-secondary shadow-inner"
    >
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}
