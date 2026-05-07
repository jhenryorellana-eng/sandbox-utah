"use client"

import { AlertTriangle, Compass, Stamp } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import type {
  FilingFormSnapshot,
  FilingResolvedFrom,
  FilingStep,
  FilingWarning,
} from "@/shared/types/database"
import { usePrintPacket } from "../hooks/use-print-packet"
import { CountyPicker } from "./county-picker"
import { DistrictBanner } from "./district-banner"
import { FeeSummary } from "./fee-summary"
import { FormsList } from "./forms-list"
import { PrintPacketButton } from "./print-packet-button"
import { ProcedureStage } from "./procedure-stage"
import { UplDisclaimer } from "./upl-disclaimer"

export interface ResolvedPacket {
  packetId: string
  caseId: string
  serviceSlug: string
  districtId: number
  districtNameEs: string
  districtNameEn: string
  countyFips: string
  countyName: string
  resolvedFrom: FilingResolvedFrom
  intakeChannel: string
  intakeChannelLabelEs: string
  intakeChannelLabelEn: string
  intakeFeeCents: number
  feeWaiverFormCode: string | null
  intakeStepsEs: FilingStep[]
  intakeStepsEn: FilingStep[]
  caseStepsEs: FilingStep[]
  caseStepsEn: FilingStep[]
  forms: FilingFormSnapshot[]
  warnings: FilingWarning[]
  sourceUrls: string[]
  aiNarrativeEs: string | null
  aiNarrativeEn: string | null
  generatedAt: string
}

export interface FilingTabProps {
  caseId: string
  locale: "es" | "en"
  state:
    | { status: "ready"; packet: ResolvedPacket }
    | { status: "needs_county"; reason: string; suggestedCity: string | null }
    | { status: "case_status_invalid"; current: string }
    | { status: "service_not_supported"; serviceSlug: string }
    | { status: "internal_error"; message: string | null }
}

export function FilingTab(props: FilingTabProps) {
  const t = useTranslations("Filing")

  if (props.state.status === "needs_county") {
    return (
      <div className="space-y-4">
        <UplDisclaimer />
        <CountyPicker
          caseId={props.caseId}
          reason={props.state.reason}
          suggestedCity={props.state.suggestedCity}
        />
      </div>
    )
  }

  if (props.state.status === "case_status_invalid") {
    return (
      <div className="space-y-4">
        <UplDisclaimer />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{t("notReady.title")}</p>
          <p className="mt-1 text-amber-800">
            {t("notReady.body", { status: props.state.current })}
          </p>
        </div>
      </div>
    )
  }

  if (props.state.status === "service_not_supported") {
    return (
      <div className="space-y-4">
        <UplDisclaimer />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{t("serviceNotSupported.title")}</p>
          <p className="mt-1 text-amber-800">
            {t("serviceNotSupported.body", { service: props.state.serviceSlug })}
          </p>
        </div>
      </div>
    )
  }

  if (props.state.status === "internal_error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-semibold">{t("errors.internal_error")}</p>
        {props.state.message ? <p className="mt-1 text-xs">{props.state.message}</p> : null}
      </div>
    )
  }

  return <FilingTabReady caseId={props.caseId} locale={props.locale} packet={props.state.packet} />
}

function FilingTabReady({
  caseId,
  locale,
  packet,
}: {
  caseId: string
  locale: "es" | "en"
  packet: ResolvedPacket
}) {
  const t = useTranslations("Filing")
  const [{ printing }, { print }] = usePrintPacket(caseId, locale)
  const [printingFormCode, setPrintingFormCode] = useState<string | null>(null)

  const handlePrintForm = async (formCode: string) => {
    setPrintingFormCode(formCode)
    try {
      await print({ scope: "single_form", formCode })
    } finally {
      setPrintingFormCode(null)
    }
  }

  const intakeSteps = locale === "en" ? packet.intakeStepsEn : packet.intakeStepsEs
  const caseSteps = locale === "en" ? packet.caseStepsEn : packet.caseStepsEs
  const aiNarrative = locale === "en" ? packet.aiNarrativeEn : packet.aiNarrativeEs

  return (
    <div className="space-y-5">
      <UplDisclaimer />

      <DistrictBanner
        districtId={packet.districtId}
        districtNameEs={packet.districtNameEs}
        districtNameEn={packet.districtNameEn}
        countyName={packet.countyName}
        countyFips={packet.countyFips}
        resolvedFrom={packet.resolvedFrom}
        locale={locale}
      />

      {aiNarrative ? (
        <section className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-900">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            {t("narrative.title")}
          </p>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{aiNarrative}</p>
        </section>
      ) : null}

      <FeeSummary
        intakeFeeCents={packet.intakeFeeCents}
        feeWaiverFormCode={packet.feeWaiverFormCode}
        intakeChannelLabelEs={packet.intakeChannelLabelEs}
        intakeChannelLabelEn={packet.intakeChannelLabelEn}
        locale={locale}
      />

      <ProcedureStage
        heading={t("stage1.heading")}
        subheading={t("stage1.subheading")}
        accent="violet"
        steps={intakeSteps}
        locale={locale}
      />

      <ProcedureStage
        heading={t("stage2.heading")}
        subheading={t("stage2.subheading")}
        accent="amber"
        steps={caseSteps}
        locale={locale}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("forms.heading")}</h3>
          <PrintPacketButton
            caseId={caseId}
            locale={locale}
            scope="full_packet"
            labelKey="actions.printPacket"
          />
        </div>
        <FormsList
          forms={packet.forms}
          locale={locale}
          printingFormCode={printing ? printingFormCode : null}
          onPrintForm={handlePrintForm}
        />
      </section>

      {packet.warnings.length > 0 ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {t("warnings.title")}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
            {packet.warnings.map((w) => (
              <li key={`${w.type}:${(locale === "en" ? w.message_en : w.message_es).slice(0, 32)}`}>
                <span className="font-mono text-[10px] text-amber-700">{w.type}</span>
                <span className="ml-2">{locale === "en" ? w.message_en : w.message_es}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {packet.sourceUrls.length > 0 ? (
        <section className="rounded-lg border border-border bg-muted/20 p-4 text-xs">
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wide text-muted-foreground">
            <Stamp className="h-3 w-3" aria-hidden="true" />
            {t("sources.title")}
          </p>
          <ul className="mt-2 space-y-1">
            {packet.sourceUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-muted-foreground underline hover:text-foreground"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
