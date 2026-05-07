"use client"

import { CircleCheck, CircleDashed, Clock4 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { FilingStep } from "@/shared/types/database"

interface ProcedureStageProps {
  heading: string
  subheading?: string
  accent: "violet" | "amber"
  steps: FilingStep[]
  locale: "es" | "en"
}

const accentClasses = {
  violet: {
    border: "border-violet-200",
    bg: "bg-violet-50/60",
    badge: "bg-violet-100 text-violet-800",
    headerText: "text-violet-900",
    detailText: "text-violet-900/80",
    metaText: "text-violet-700",
  },
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    badge: "bg-amber-100 text-amber-800",
    headerText: "text-amber-900",
    detailText: "text-amber-900/80",
    metaText: "text-amber-700",
  },
}

export function ProcedureStage({
  heading,
  subheading,
  accent,
  steps,
  locale,
}: ProcedureStageProps) {
  const t = useTranslations("Filing")
  const styles = accentClasses[accent]

  return (
    <section className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <div className="mb-3">
        <p className={`text-sm font-semibold ${styles.headerText}`}>{heading}</p>
        {subheading ? <p className={`text-xs ${styles.metaText}`}>{subheading}</p> : null}
      </div>
      {steps.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">{t("noStepsYet")}</p>
      ) : (
        <ol className="space-y-2.5">
          {steps.map((step) => (
            <li key={step.step} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${styles.badge} text-xs font-bold`}
              >
                {step.step}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${styles.headerText}`}>{step.title}</p>
                <p className={`mt-0.5 text-sm ${styles.detailText}`}>{step.detail}</p>
                <div
                  className={`mt-1 flex flex-wrap items-center gap-3 text-[11px] ${styles.metaText}`}
                >
                  {step.estimated_time ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock4 className="h-3 w-3" aria-hidden="true" />
                      {step.estimated_time}
                    </span>
                  ) : null}
                  {step.requires_client_action ? (
                    <span className="inline-flex items-center gap-1">
                      <CircleDashed className="h-3 w-3" aria-hidden="true" />
                      {t("steps.requiresClientAction", { default: "Acción del cliente" })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <CircleCheck className="h-3 w-3" aria-hidden="true" />
                      {t("steps.systemHandled", { default: "Sistema/Corte" })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="sr-only">{locale}</p>
    </section>
  )
}
