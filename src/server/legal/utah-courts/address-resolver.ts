import "server-only"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import type { FilingResolvedFrom } from "@/shared/types/database"
import type { DistrictId } from "./county-mapper"
import {
  getCountyByFips,
  getCountyByName,
  getDistrictForCounty,
  lookupCountyByCity,
} from "./county-mapper"

/**
 * Resuelve el condado / distrito judicial donde radicar un caso.
 *
 * Estrategia híbrida (acordada con el usuario):
 *   1. Si `cases.filing_county_fips` ya está fijado, lo respetamos (cache de
 *      decisión confirmada por el cliente).
 *   2. Si la verificación de identidad está aprobada con dirección Utah, leemos
 *      `extracted_address_city` y mapeamos a condado vía heurística (cubre
 *      ~85% de la población). Confidence='high'.
 *   3. Si la heurística no resuelve la ciudad, devolvemos `needs_manual` para
 *      que la UI muestre el dropdown de 29 condados.
 *
 * **Importante**: nunca llamamos a un geocoder externo aquí (PII). El paso 3
 * delega al cliente la confirmación.
 */

export type AddressResolution =
  | {
      status: "resolved"
      countyFips: string
      countyName: string
      districtId: DistrictId
      source: FilingResolvedFrom
      confidence: "high" | "medium"
    }
  | {
      status: "needs_manual"
      reason: "no_address" | "city_not_recognized" | "identity_not_approved" | "out_of_state"
      suggestedCity?: string | null
    }

export interface ResolveOptions {
  /** Si true, prefiere el cliente service-role (bypassa RLS). Para route handlers que cargan datos cross-tabla. */
  asService?: boolean
}

export async function resolveCountyForCase(
  caseId: string,
  opts: ResolveOptions = {},
): Promise<AddressResolution> {
  const supabase = opts.asService ? createServiceClient() : await createServerClient()

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .select("client_id, filing_county_fips")
    .eq("id", caseId)
    .maybeSingle()

  if (caseErr || !caseRow) {
    return { status: "needs_manual", reason: "no_address" }
  }

  // (1) Decisión cacheada
  if (caseRow.filing_county_fips) {
    const county = getCountyByFips(caseRow.filing_county_fips)
    if (county) {
      return {
        status: "resolved",
        countyFips: county.fipsCode,
        countyName: county.name,
        districtId: county.district,
        source: "manual_county",
        confidence: "high",
      }
    }
  }

  // (2) Identity verification aprobada
  const { data: idVer } = await supabase
    .from("identity_verifications")
    .select("status, extracted_address_state, extracted_address_city, extracted_address_zip")
    .eq("user_id", caseRow.client_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!idVer) {
    return { status: "needs_manual", reason: "no_address" }
  }
  if (idVer.status !== "approved") {
    return { status: "needs_manual", reason: "identity_not_approved" }
  }
  if (idVer.extracted_address_state && idVer.extracted_address_state.toUpperCase() !== "UT") {
    return { status: "needs_manual", reason: "out_of_state" }
  }

  const city = idVer.extracted_address_city
  if (!city) {
    return { status: "needs_manual", reason: "no_address" }
  }

  const county = lookupCountyByCity(city)
  if (!county) {
    return { status: "needs_manual", reason: "city_not_recognized", suggestedCity: city }
  }

  return {
    status: "resolved",
    countyFips: county.fipsCode,
    countyName: county.name,
    districtId: county.district,
    source: "identity_doc",
    confidence: "high",
  }
}

/**
 * Persiste la decisión final del cliente (ya sea automática o manual) en cases
 * y devuelve el distrito asociado. Usa service-role porque las RLS permiten al
 * propio cliente actualizar `cases` sólo en ciertos `intake_status`; el filing
 * happens post-finalize, así que necesitamos bypass controlado.
 */
export async function persistFilingLocation(
  caseId: string,
  countyFips: string,
): Promise<{ districtId: DistrictId } | { error: string }> {
  const county = getCountyByFips(countyFips)
  if (!county) return { error: "invalid_county" }

  const service = createServiceClient()
  const { error } = await service
    .from("cases")
    .update({
      filing_county_fips: county.fipsCode,
      filing_district_id: county.district,
    })
    .eq("id", caseId)

  if (error) return { error: error.message }
  return { districtId: county.district }
}

/**
 * Helper para tests / UI: convierte un nombre escrito por el cliente en el
 * dropdown a su FIPS code.
 */
export function countyFipsFromInput(input: string): string | null {
  return getCountyByName(input)?.fipsCode ?? null
}

export function districtFromCounty(fips: string): DistrictId | null {
  return getDistrictForCounty(fips)
}
