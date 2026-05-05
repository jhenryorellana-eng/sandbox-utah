import "server-only"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import type {
  FilingFormSnapshot,
  FilingResolvedFrom,
  FilingStep,
  FilingWarning,
  Json,
} from "@/shared/types/database"
import { resolveCountyForCase } from "./address-resolver"
import { type DistrictId, getCountyByFips } from "./county-mapper"
import { getOrFetchForm } from "./form-cache"
import { loadProcedure } from "./procedure-loader"
import { validateVenue } from "./venue-validator"

/**
 * Construye/recupera el snapshot inmutable del packet para un caso. NO genera
 * PDF — eso lo hace el módulo `src/server/legal/pdf` al imprimir. Aquí sólo se
 * preparan los datos autoritativos en `case_filing_packets`.
 *
 * Flujo:
 *   1. Verificar autorización (case pertenece al user O user es admin).
 *   2. Resolver address → distrito.
 *   3. Cargar procedure (statewide o override por distrito).
 *   4. Validar venue contra contexto del caso.
 *   5. Pre-cachear PDFs oficiales (HEAD check + descarga si stale).
 *   6. Insert OR update no-snapshot fields del packet.
 *   7. Retornar el packet completo.
 */

export interface BuildPacketInput {
  caseId: string
  /** Si null, se intenta resolver automáticamente desde identity verification. */
  countyFipsOverride?: string | null
  /** Trigger de regeneración: si true, NO crea snapshot nuevo; sólo confirma cache. */
  refreshFormsOnly?: boolean
  /** Si true, borra el packet existente y crea uno nuevo. Default false: idempotente. */
  forceRecreate?: boolean
}

export interface BuildPacketResult {
  packetId: string
  caseId: string
  serviceSlug: string
  districtId: DistrictId
  resolvedFrom: FilingResolvedFrom
  countyFips: string
  countyName: string
  intakeChannel: string
  intakeFeeCents: number
  forms: FilingFormSnapshot[]
  intakeStepsEs: FilingStep[]
  intakeStepsEn: FilingStep[]
  caseStepsEs: FilingStep[]
  caseStepsEn: FilingStep[]
  warnings: FilingWarning[]
  sourceUrls: string[]
  cacheHits: number
  cacheMisses: number
  generatedAt: string
}

export type BuildPacketError =
  | { kind: "address_unresolved"; reason: string; suggestedCity?: string | null }
  | { kind: "service_not_supported"; serviceSlug: string }
  | { kind: "case_not_found" }
  | { kind: "case_status_invalid"; current: string }
  | { kind: "internal"; message: string }

const ALLOWED_INTAKE_STATUSES = new Set(["approved", "finalized", "review_pending", "in_progress"])

/**
 * Recupera el packet existente sin regenerar (útil para GET).
 */
export async function getOrCreatePacket(
  input: BuildPacketInput,
  opts: { allowCreate: boolean },
): Promise<{ ok: true; packet: BuildPacketResult } | { ok: false; error: BuildPacketError }> {
  const service = createServiceClient()
  const { data: caseRow, error: caseErr } = await service
    .from("cases")
    .select(
      "id, client_id, service_id, intake_status, beneficiary_data, form_data, filing_county_fips",
    )
    .eq("id", input.caseId)
    .maybeSingle()

  if (caseErr || !caseRow) return { ok: false, error: { kind: "case_not_found" } }
  if (!ALLOWED_INTAKE_STATUSES.has(caseRow.intake_status)) {
    return { ok: false, error: { kind: "case_status_invalid", current: caseRow.intake_status } }
  }

  const { data: serviceRow, error: serviceErr } = await service
    .from("services")
    .select("slug")
    .eq("id", caseRow.service_id)
    .maybeSingle()

  if (serviceErr || !serviceRow) return { ok: false, error: { kind: "case_not_found" } }
  const serviceSlug = serviceRow.slug

  const { data: existing } = await service
    .from("case_filing_packets")
    .select("*")
    .eq("case_id", input.caseId)
    .maybeSingle()

  if (existing) {
    return {
      ok: true,
      packet: hydrateExisting(existing, serviceSlug),
    }
  }

  if (!opts.allowCreate) {
    return { ok: false, error: { kind: "address_unresolved", reason: "no_packet_yet" } }
  }

  return buildPacket(input)
}

export async function buildPacket(
  input: BuildPacketInput,
): Promise<{ ok: true; packet: BuildPacketResult } | { ok: false; error: BuildPacketError }> {
  const service = createServiceClient()

  // 1. Cargar caso + servicio
  const { data: caseRow, error: caseErr } = await service
    .from("cases")
    .select(
      "id, client_id, service_id, intake_status, form_data, beneficiary_data, filing_county_fips",
    )
    .eq("id", input.caseId)
    .maybeSingle()
  if (caseErr || !caseRow) return { ok: false, error: { kind: "case_not_found" } }
  if (!ALLOWED_INTAKE_STATUSES.has(caseRow.intake_status)) {
    return { ok: false, error: { kind: "case_status_invalid", current: caseRow.intake_status } }
  }

  const { data: serviceRow, error: serviceErr } = await service
    .from("services")
    .select("slug, name_es, name_en")
    .eq("id", caseRow.service_id)
    .maybeSingle()
  if (serviceErr || !serviceRow) return { ok: false, error: { kind: "case_not_found" } }
  const serviceSlug = serviceRow.slug

  // Idempotencia: si ya existe un packet y no se pidió forceRecreate, devolver
  // el existente. Esto protege contra doble render de RSC en dev (Strict Mode)
  // y contra concurrencia natural de tabs duplicados.
  if (!input.forceRecreate) {
    const { data: existing } = await service
      .from("case_filing_packets")
      .select("*")
      .eq("case_id", input.caseId)
      .maybeSingle()
    if (existing) {
      return { ok: true, packet: hydrateExisting(existing, serviceSlug) }
    }
  }

  // 2. Resolver address → distrito
  let districtId: DistrictId | null = null
  let countyFips: string | null = null
  let resolvedFrom: FilingResolvedFrom = "manual_county"
  let countyName = ""

  if (input.countyFipsOverride) {
    const county = getCountyByFips(input.countyFipsOverride)
    if (!county) {
      return {
        ok: false,
        error: { kind: "address_unresolved", reason: "invalid_override" },
      }
    }
    countyFips = county.fipsCode
    countyName = county.name
    districtId = county.district
    resolvedFrom = "manual_county"
  } else {
    const resolution = await resolveCountyForCase(input.caseId, { asService: true })
    if (resolution.status !== "resolved") {
      return {
        ok: false,
        error: {
          kind: "address_unresolved",
          reason: resolution.reason,
          ...(resolution.status === "needs_manual" && resolution.reason === "city_not_recognized"
            ? { suggestedCity: resolution.suggestedCity ?? null }
            : {}),
        },
      }
    }
    countyFips = resolution.countyFips
    countyName = resolution.countyName
    districtId = resolution.districtId
    resolvedFrom = resolution.source
  }

  if (!districtId || !countyFips) {
    return { ok: false, error: { kind: "address_unresolved", reason: "no_district" } }
  }

  // 3. Persistir filing_county_fips/filing_district_id en cases
  await service
    .from("cases")
    .update({ filing_county_fips: countyFips, filing_district_id: districtId })
    .eq("id", input.caseId)

  // 4. Cargar procedure
  const procedure = await loadProcedure(serviceSlug, districtId)
  if (!procedure) {
    return { ok: false, error: { kind: "service_not_supported", serviceSlug } }
  }

  // 5. Validar venue
  const venueWarnings = validateVenue({
    serviceSlug,
    filingCountyFips: countyFips,
    contextHints: extractVenueHints(serviceSlug, caseRow.form_data, caseRow.beneficiary_data),
  })
  const warnings: FilingWarning[] = venueWarnings.map((w) => ({
    type: w.type,
    message_es: w.message_es,
    message_en: w.message_en,
  }))

  // 6. Pre-cachear PDFs (best-effort; los errores se anotan como warnings)
  let cacheHits = 0
  let cacheMisses = 0
  const formsSnapshot: FilingFormSnapshot[] = []
  for (const form of procedure.forms) {
    if (form.format !== "pdf") {
      formsSnapshot.push(form)
      continue
    }
    const cacheRes = await getOrFetchForm(form.form_code)
    if (cacheRes.kind === "pdf") {
      formsSnapshot.push({ ...form, cached_sha256: cacheRes.sha256 })
      if (cacheRes.fromCache) cacheHits += 1
      else cacheMisses += 1
    } else if (cacheRes.kind === "deep_link") {
      formsSnapshot.push(form)
    } else {
      formsSnapshot.push(form)
      warnings.push({
        type: "form_unavailable",
        message_es: `No pudimos verificar el formulario ${form.form_code} contra utcourts.gov. Usa el enlace oficial.`,
        message_en: `We could not verify form ${form.form_code} against utcourts.gov. Use the official link.`,
      })
    }
  }

  // 7. Upsert snapshot
  const generatedAt = new Date().toISOString()
  const supabase = await createServerClient()
  const { data: authUser } = await supabase.auth.getUser()
  const generatedBy = authUser?.user?.id ?? null

  // forceRecreate: borrar el packet anterior antes de crear el nuevo.
  if (input.forceRecreate) {
    await service.from("case_filing_packets").delete().eq("case_id", input.caseId)
  }

  // Insert con conflict handling: si una llamada concurrente ganó la carrera,
  // re-leer el existente.
  const inserted = await insertPacket({
    caseId: input.caseId,
    districtId,
    procedureId: procedure.id,
    intakeStepsEs: procedure.intakeSteps.es,
    intakeStepsEn: procedure.intakeSteps.en,
    caseStepsEs: procedure.caseSteps.es,
    caseStepsEn: procedure.caseSteps.en,
    formsSnapshot,
    feeCents: procedure.intakeFilingFeeCents,
    warnings,
    sourceUrls: procedure.sourceUrls,
    resolvedFrom,
    countyFips,
    generatedBy,
  })

  if (!inserted.ok) {
    if (
      inserted.error.includes("case_filing_packets_case_id_key") ||
      inserted.error.includes("duplicate key")
    ) {
      const { data: raced } = await service
        .from("case_filing_packets")
        .select("*")
        .eq("case_id", input.caseId)
        .maybeSingle()
      if (raced) return { ok: true, packet: hydrateExisting(raced, serviceSlug) }
    }
    return { ok: false, error: { kind: "internal", message: inserted.error } }
  }
  const packetId = inserted.id

  await service.from("case_activities").insert({
    case_id: input.caseId,
    actor_id: generatedBy,
    actor_type: generatedBy ? "client" : "system",
    activity_type: "filing.packet.generated",
    description: `Packet de radicación generado para distrito ${districtId} (${countyName}).`,
    metadata: {
      packet_id: packetId,
      district_id: districtId,
      county_fips: countyFips,
      cache_hits: cacheHits,
      cache_misses: cacheMisses,
    } as Json,
  })

  return {
    ok: true,
    packet: {
      packetId,
      caseId: input.caseId,
      serviceSlug,
      districtId,
      resolvedFrom,
      countyFips,
      countyName,
      intakeChannel: procedure.intakeChannel,
      intakeFeeCents: procedure.intakeFilingFeeCents,
      forms: formsSnapshot,
      intakeStepsEs: procedure.intakeSteps.es,
      intakeStepsEn: procedure.intakeSteps.en,
      caseStepsEs: procedure.caseSteps.es,
      caseStepsEn: procedure.caseSteps.en,
      warnings,
      sourceUrls: procedure.sourceUrls,
      cacheHits,
      cacheMisses,
      generatedAt,
    },
  }
}

interface InsertPacketArgs {
  caseId: string
  districtId: DistrictId
  procedureId: string
  intakeStepsEs: FilingStep[]
  intakeStepsEn: FilingStep[]
  caseStepsEs: FilingStep[]
  caseStepsEn: FilingStep[]
  formsSnapshot: FilingFormSnapshot[]
  feeCents: number
  warnings: FilingWarning[]
  sourceUrls: string[]
  resolvedFrom: FilingResolvedFrom
  countyFips: string
  generatedBy: string | null
}

async function insertPacket(
  args: InsertPacketArgs,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("case_filing_packets")
    .insert({
      case_id: args.caseId,
      district_id: args.districtId,
      procedure_id: args.procedureId,
      intake_steps_snapshot_es: args.intakeStepsEs as unknown as Json,
      intake_steps_snapshot_en: args.intakeStepsEn as unknown as Json,
      case_steps_snapshot_es: args.caseStepsEs as unknown as Json,
      case_steps_snapshot_en: args.caseStepsEn as unknown as Json,
      forms_snapshot: args.formsSnapshot as unknown as Json,
      fee_snapshot_cents: args.feeCents,
      ai_warnings: args.warnings as unknown as Json,
      ai_grounded_sources: args.sourceUrls as unknown as Json,
      resolved_from: args.resolvedFrom,
      resolved_county_fips: args.countyFips,
      generated_by: args.generatedBy,
    })
    .select("id")
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" }
  return { ok: true, id: data.id }
}

function extractVenueHints(
  serviceSlug: string,
  formData: Json,
  beneficiaryData: Json | null,
): {
  propertyCountyFips?: string | null
  childResidesInUtah?: boolean | null
  petitionerResidesCountyFips?: string | null
} {
  const fd = (formData ?? {}) as Record<string, unknown>
  const bd = (beneficiaryData ?? {}) as Record<string, unknown>
  if (serviceSlug === "eviction-defense") {
    const fips = typeof fd.property_county_fips === "string" ? fd.property_county_fips : null
    return { propertyCountyFips: fips }
  }
  if (serviceSlug === "child-custody") {
    const inUtah = typeof bd.child_resides_in_utah === "boolean" ? bd.child_resides_in_utah : null
    return { childResidesInUtah: inUtah }
  }
  if (serviceSlug === "uncontested-divorce" || serviceSlug === "name-change") {
    const fips = typeof fd.petitioner_county_fips === "string" ? fd.petitioner_county_fips : null
    return { petitionerResidesCountyFips: fips }
  }
  return {}
}

interface PacketRow {
  id: string
  case_id: string
  district_id: number
  procedure_id: string
  intake_steps_snapshot_es: Json
  intake_steps_snapshot_en: Json
  case_steps_snapshot_es: Json
  case_steps_snapshot_en: Json
  forms_snapshot: Json
  fee_snapshot_cents: number
  ai_warnings: Json
  ai_grounded_sources: Json
  resolved_from: FilingResolvedFrom
  resolved_county_fips: string
  generated_at: string
}

function hydrateExisting(row: PacketRow, serviceSlug: string): BuildPacketResult {
  const county = getCountyByFips(row.resolved_county_fips)
  return {
    packetId: row.id,
    caseId: row.case_id,
    serviceSlug,
    districtId: row.district_id as DistrictId,
    resolvedFrom: row.resolved_from,
    countyFips: row.resolved_county_fips,
    countyName: county?.name ?? "",
    intakeChannel: "",
    intakeFeeCents: row.fee_snapshot_cents,
    forms: parseSnapshotForms(row.forms_snapshot),
    intakeStepsEs: parseSteps(row.intake_steps_snapshot_es),
    intakeStepsEn: parseSteps(row.intake_steps_snapshot_en),
    caseStepsEs: parseSteps(row.case_steps_snapshot_es),
    caseStepsEn: parseSteps(row.case_steps_snapshot_en),
    warnings: parseWarnings(row.ai_warnings),
    sourceUrls: parseStringArray(row.ai_grounded_sources),
    cacheHits: 0,
    cacheMisses: 0,
    generatedAt: row.generated_at,
  }
}

function parseSteps(value: Json): FilingStep[] {
  if (!Array.isArray(value)) return []
  const out: FilingStep[] = []
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const obj = item as Record<string, Json>
    if (
      typeof obj.step !== "number" ||
      typeof obj.title !== "string" ||
      typeof obj.detail !== "string"
    ) {
      continue
    }
    const base: FilingStep = {
      step: obj.step,
      title: obj.title,
      detail: obj.detail,
      requires_client_action: obj.requires_client_action === true,
    }
    if (typeof obj.estimated_time === "string") {
      out.push({ ...base, estimated_time: obj.estimated_time })
    } else {
      out.push(base)
    }
  }
  return out.sort((a, b) => a.step - b.step)
}

function parseSnapshotForms(value: Json): FilingFormSnapshot[] {
  if (!Array.isArray(value)) return []
  const out: FilingFormSnapshot[] = []
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const obj = item as Record<string, Json>
    if (
      typeof obj.form_code !== "string" ||
      typeof obj.name_es !== "string" ||
      typeof obj.name_en !== "string" ||
      typeof obj.url_official !== "string"
    ) {
      continue
    }
    out.push({
      form_code: obj.form_code,
      name_es: obj.name_es,
      name_en: obj.name_en,
      description_es: typeof obj.description_es === "string" ? obj.description_es : null,
      description_en: typeof obj.description_en === "string" ? obj.description_en : null,
      url_official: obj.url_official,
      format: (typeof obj.format === "string" ? obj.format : "pdf") as FilingFormSnapshot["format"],
      is_mandatory: obj.is_mandatory === true,
      ordering: typeof obj.ordering === "number" ? obj.ordering : 0,
      cached_sha256: typeof obj.cached_sha256 === "string" ? obj.cached_sha256 : null,
    })
  }
  return out.sort((a, b) => a.ordering - b.ordering)
}

function parseWarnings(value: Json): FilingWarning[] {
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

function parseStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string")
}
