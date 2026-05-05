"use client"

import { Receipt, ShieldQuestion } from "lucide-react"
import { useTranslations } from "next-intl"
import { Money } from "@/shared/domain/money"

export interface FeeSummaryProps {
  intakeFeeCents: number
  feeWaiverFormCode: string | null
  intakeChannelLabelEs: string
  intakeChannelLabelEn: string
  locale: "es" | "en"
}

export function FeeSummary({
  intakeFeeCents,
  feeWaiverFormCode,
  intakeChannelLabelEs,
  intakeChannelLabelEn,
  locale,
}: FeeSummaryProps) {
  const t = useTranslations("Filing")
  const money = Money.fromCents(intakeFeeCents)
  const channel = locale === "en" ? intakeChannelLabelEn : intakeChannelLabelEs

  return (
    <div className="rounded-md border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("fees.filingFee")}
          </p>
          <p className="text-2xl font-bold">
            {intakeFeeCents === 0 ? t("fees.noCost") : money.format(locale)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>{channel}</span>
        </div>
      </div>
      {feeWaiverFormCode ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
          {t("fees.waiverHint", { code: feeWaiverFormCode })}
        </p>
      ) : null}
    </div>
  )
}
