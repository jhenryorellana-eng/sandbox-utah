import { notFound, redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { fetchCaseById } from "@/features/cases/repository"
import { FilingTab, type ResolvedPacket } from "@/features/filing/components/filing-tab"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { narrateFiling } from "@/server/integrations/gemini/filing-narrator"
import { buildPacket } from "@/server/legal/utah-courts"
import type { FilingFormSnapshot, FilingStep, FilingWarning, Json } from "@/shared/types/database"

const ALLOWED_INTAKE_STATUSES = new Set(["approved", "finalized", "review_pending", "in_progress"])

const CHANNEL_LABELS_ES: Record<string, string> = {
  in_person: "Presencial",
  mail: "Correo postal",
  email: "Por email",
  mycase: "MyCase (e-filing)",
  efile: "efile.utcourts.gov",
  hybrid: "Múltiples canales",
}
const CHANNEL_LABELS_EN: Record<string, string> = {
  in_person: "In person",
  mail: "Postal mail",
  email: "Email",
  mycase: "MyCase (e-filing)",
  efile: "efile.utcourts.gov",
  hybrid: "Multiple channels",
}

export default async function CaseFilingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: rawLocale, id } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Filing" })

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const caseRow = await fetchCaseById(id, user.id)
  if (!caseRow) notFound()

  const buildResult = await buildPacket({ caseId: id })

  let viewState: React.ComponentProps<typeof FilingTab>["state"]

  if (!buildResult.ok) {
    const err = buildResult.error
    if (err.kind === "address_unresolved") {
      viewState = {
        status: "needs_county",
        reason: err.reason,
        suggestedCity: "suggestedCity" in err ? (err.suggestedCity ?? null) : null,
      }
    } else if (err.kind === "case_status_invalid") {
      viewState = { status: "case_status_invalid", current: err.current }
    } else if (err.kind === "service_not_supported") {
      viewState = { status: "service_not_supported", serviceSlug: err.serviceSlug }
    } else if (err.kind === "case_not_found") {
      notFound()
    } else {
      viewState = { status: "internal_error", message: err.message }
    }
  } else {
    if (!ALLOWED_INTAKE_STATUSES.has(caseRow.intake_status)) {
      viewState = { status: "case_status_invalid", current: caseRow.intake_status }
    } else {
      const packet = buildResult.packet
      const districtNames = await loadDistrictNames(packet.districtId)
      const aiNarrative = await loadOrGenerateNarrative({
        caseId: id,
        userId: user.id,
        serviceSlug: packet.serviceSlug,
        serviceNameEs: caseRow.service.name_es,
        serviceNameEn: caseRow.service.name_en,
        districtId: packet.districtId,
        districtNameEs: districtNames.es,
        districtNameEn: districtNames.en,
        countyName: packet.countyName,
        intakeChannel: packet.intakeChannel,
        intakeFeeCents: packet.intakeFeeCents,
        intakeStepsEs: packet.intakeStepsEs,
        intakeStepsEn: packet.intakeStepsEn,
        caseStepsEs: packet.caseStepsEs,
        caseStepsEn: packet.caseStepsEn,
        forms: packet.forms,
        venue: { es: "", en: "", statute: "" },
        sourceUrls: packet.sourceUrls,
      })

      const resolved: ResolvedPacket = {
        packetId: packet.packetId,
        caseId: packet.caseId,
        serviceSlug: packet.serviceSlug,
        districtId: packet.districtId,
        districtNameEs: districtNames.es,
        districtNameEn: districtNames.en,
        countyFips: packet.countyFips,
        countyName: packet.countyName,
        resolvedFrom: packet.resolvedFrom,
        intakeChannel: packet.intakeChannel,
        intakeChannelLabelEs: CHANNEL_LABELS_ES[packet.intakeChannel] ?? packet.intakeChannel,
        intakeChannelLabelEn: CHANNEL_LABELS_EN[packet.intakeChannel] ?? packet.intakeChannel,
        intakeFeeCents: packet.intakeFeeCents,
        feeWaiverFormCode: packet.forms.find((f) => f.form_code === "1301GE")?.form_code ?? null,
        intakeStepsEs: packet.intakeStepsEs,
        intakeStepsEn: packet.intakeStepsEn,
        caseStepsEs: packet.caseStepsEs,
        caseStepsEn: packet.caseStepsEn,
        forms: packet.forms,
        warnings: packet.warnings,
        sourceUrls: packet.sourceUrls,
        aiNarrativeEs: aiNarrative?.es ?? null,
        aiNarrativeEn: aiNarrative?.en ?? null,
        generatedAt: packet.generatedAt,
      }
      viewState = { status: "ready", packet: resolved }
    }
  }

  return (
    <section className="page-shell max-w-4xl flex-1">
      <p className="brand-kicker">
        <Link href={`/cases/${id}`} className="hover:underline">
          ← {caseRow.case_number}
        </Link>
      </p>
      <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">{t("tabTitle")}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("tabSubtitle")}</p>

      <div className="mt-6">
        <FilingTab caseId={id} locale={locale} state={viewState} />
      </div>
    </section>
  )
}

async function loadDistrictNames(districtId: number): Promise<{ es: string; en: string }> {
  const service = createServiceClient()
  const { data } = await service
    .from("judicial_districts")
    .select("name_es, name_en")
    .eq("id", districtId)
    .maybeSingle()
  return {
    es: data?.name_es ?? `Distrito ${districtId}`,
    en: data?.name_en ?? `District ${districtId}`,
  }
}

interface NarrativeArgs {
  caseId: string
  userId: string
  serviceSlug: string
  serviceNameEs: string
  serviceNameEn: string
  districtId: number
  districtNameEs: string
  districtNameEn: string
  countyName: string
  intakeChannel: string
  intakeFeeCents: number
  intakeStepsEs: FilingStep[]
  intakeStepsEn: FilingStep[]
  caseStepsEs: FilingStep[]
  caseStepsEn: FilingStep[]
  forms: FilingFormSnapshot[]
  venue: { es: string; en: string; statute: string }
  sourceUrls: string[]
}

async function loadOrGenerateNarrative(
  args: NarrativeArgs,
): Promise<{ es: string; en: string; warnings: FilingWarning[] } | null> {
  const service = createServiceClient()

  // Si el packet ya tiene narrativa cacheada, usarla.
  const { data: existing } = await service
    .from("case_filing_packets")
    .select("ai_narrative_es, ai_narrative_en, ai_warnings, ai_grounded_sources")
    .eq("case_id", args.caseId)
    .maybeSingle()
  if (existing?.ai_narrative_es && existing.ai_narrative_en) {
    const warnings = parseWarningsJson(existing.ai_warnings)
    return {
      es: existing.ai_narrative_es,
      en: existing.ai_narrative_en,
      warnings,
    }
  }

  // Generar via Gemini con grounding (best-effort; fallback a null si bloqueado).
  const result = await narrateFiling({
    caseId: args.caseId,
    userId: args.userId,
    serviceSlug: args.serviceSlug,
    serviceNameEs: args.serviceNameEs,
    serviceNameEn: args.serviceNameEn,
    districtId: args.districtId,
    districtNameEs: args.districtNameEs,
    districtNameEn: args.districtNameEn,
    countyName: args.countyName,
    intakeChannel: args.intakeChannel,
    intakeFeeCents: args.intakeFeeCents,
    intakeStepsEs: args.intakeStepsEs,
    intakeStepsEn: args.intakeStepsEn,
    caseStepsEs: args.caseStepsEs,
    caseStepsEn: args.caseStepsEn,
    forms: args.forms,
    venueRuleEs: args.venue.es,
    venueRuleEn: args.venue.en,
    venueStatuteRef: args.venue.statute,
    sourceUrls: args.sourceUrls,
  })

  if (result.blocked) return null

  // Persistir en el packet existente
  await service
    .from("case_filing_packets")
    .update({
      ai_narrative_es: result.narrative_es,
      ai_narrative_en: result.narrative_en,
      ai_warnings: result.warnings as unknown as Json,
      ai_model: result.model,
    })
    .eq("case_id", args.caseId)

  return {
    es: result.narrative_es,
    en: result.narrative_en,
    warnings: result.warnings,
  }
}

function parseWarningsJson(value: Json): FilingWarning[] {
  if (!Array.isArray(value)) return []
  const out: FilingWarning[] = []
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const obj = item as Record<string, Json>
    if (
      typeof obj.type === "string" &&
      typeof obj.message_es === "string" &&
      typeof obj.message_en === "string"
    ) {
      out.push({ type: obj.type, message_es: obj.message_es, message_en: obj.message_en })
    }
  }
  return out
}
