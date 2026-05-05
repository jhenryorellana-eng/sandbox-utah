import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { FilingFormSnapshot, FilingStep, IntakeChannel, Json } from "@/shared/types/database"
import type { DistrictId } from "./county-mapper"

export interface LoadedProcedure {
  id: string
  serviceSlug: string
  districtId: DistrictId | null
  intakeChannel: IntakeChannel
  intakeSteps: { es: FilingStep[]; en: FilingStep[] }
  caseSteps: { es: FilingStep[]; en: FilingStep[] }
  intakeFilingFeeCents: number
  intakeFeeWaiverFormCode: string | null
  caseTypicalDurationDays: number | null
  venue: { es: string; en: string; statute: string }
  sourceUrls: string[]
  forms: FilingFormSnapshot[]
  lastVerifiedAt: string
}

/**
 * Carga el procedimiento autoritativo para un servicio + distrito. Si no hay
 * un row específico para el distrito, cae al statewide (district_id NULL).
 *
 * También carga los formularios oficiales asociados al servicio (filtra por
 * district_specific NULL o = districtId).
 */
export async function loadProcedure(
  serviceSlug: string,
  districtId: DistrictId,
): Promise<LoadedProcedure | null> {
  const supabase = await createServerClient()

  // Preferimos override por distrito; si no, statewide. Pasamos el select como
  // string literal para que Supabase infiera tipos correctamente.
  const { data: districtSpecific } = await supabase
    .from("case_filing_procedures")
    .select(
      "id, service_slug, district_id, intake_channel, intake_steps_es, intake_steps_en, intake_filing_fee_cents, intake_fee_waiver_form_code, case_steps_es, case_steps_en, case_typical_duration_days, venue_rule_es, venue_rule_en, venue_statute_ref, source_urls, last_verified_at",
    )
    .eq("service_slug", serviceSlug)
    .eq("is_active", true)
    .eq("district_id", districtId)
    .maybeSingle()

  let procRow = districtSpecific
  if (!procRow) {
    const { data: statewide } = await supabase
      .from("case_filing_procedures")
      .select(
        "id, service_slug, district_id, intake_channel, intake_steps_es, intake_steps_en, intake_filing_fee_cents, intake_fee_waiver_form_code, case_steps_es, case_steps_en, case_typical_duration_days, venue_rule_es, venue_rule_en, venue_statute_ref, source_urls, last_verified_at",
      )
      .eq("service_slug", serviceSlug)
      .eq("is_active", true)
      .is("district_id", null)
      .maybeSingle()
    procRow = statewide
  }
  if (!procRow) return null

  const { data: formRows, error: formsErr } = await supabase
    .from("official_court_forms")
    .select(
      "form_code, name_es, name_en, description_es, description_en, url_official, format, is_mandatory, ordering, cached_sha256, district_specific",
    )
    .contains("service_slugs", [serviceSlug])
    .eq("is_active", true)
    .order("ordering", { ascending: true })

  if (formsErr) {
    console.error("[procedure-loader] forms", formsErr.message)
  }

  const forms: FilingFormSnapshot[] = (formRows ?? [])
    .filter((f) => f.district_specific === null || f.district_specific === districtId)
    .map(
      (f): FilingFormSnapshot => ({
        form_code: f.form_code,
        name_es: f.name_es,
        name_en: f.name_en,
        description_es: f.description_es,
        description_en: f.description_en,
        url_official: f.url_official,
        format: f.format,
        is_mandatory: f.is_mandatory,
        ordering: f.ordering,
        cached_sha256: f.cached_sha256,
      }),
    )

  return {
    id: procRow.id,
    serviceSlug: procRow.service_slug,
    districtId: (procRow.district_id ?? null) as DistrictId | null,
    intakeChannel: procRow.intake_channel,
    intakeSteps: {
      es: parseSteps(procRow.intake_steps_es),
      en: parseSteps(procRow.intake_steps_en),
    },
    caseSteps: {
      es: parseSteps(procRow.case_steps_es),
      en: parseSteps(procRow.case_steps_en),
    },
    intakeFilingFeeCents: procRow.intake_filing_fee_cents,
    intakeFeeWaiverFormCode: procRow.intake_fee_waiver_form_code,
    caseTypicalDurationDays: procRow.case_typical_duration_days,
    venue: {
      es: procRow.venue_rule_es,
      en: procRow.venue_rule_en,
      statute: procRow.venue_statute_ref,
    },
    sourceUrls: parseStringArray(procRow.source_urls),
    forms,
    lastVerifiedAt: procRow.last_verified_at,
  }
}

function parseSteps(value: Json): FilingStep[] {
  if (!Array.isArray(value)) return []
  const out: FilingStep[] = []
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const step = (item as Record<string, Json>).step
    const title = (item as Record<string, Json>).title
    const detail = (item as Record<string, Json>).detail
    const requiresAction = (item as Record<string, Json>).requires_client_action
    if (typeof step !== "number" || typeof title !== "string" || typeof detail !== "string")
      continue
    const estimatedTime = (item as Record<string, Json>).estimated_time
    const base: FilingStep = {
      step,
      title,
      detail,
      requires_client_action: requiresAction === true,
    }
    if (typeof estimatedTime === "string") {
      out.push({ ...base, estimated_time: estimatedTime })
    } else {
      out.push(base)
    }
  }
  return out.sort((a, b) => a.step - b.step)
}

function parseStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string")
}
