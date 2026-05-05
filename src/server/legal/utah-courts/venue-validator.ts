import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import { getCountyByFips } from "./county-mapper"

/**
 * Valida que el condado de radicación elegido por el cliente cumpla con la regla
 * de venue (UCA 78B-3a) para el servicio.
 *
 * NO bloquea el flujo si la regla se rompe — sólo emite un `ai_warning` que la
 * UI muestra al cliente con el statute_ref. La decisión final es del cliente
 * (consistente con guardrails: NO advice).
 */

export type VenueViolationKind =
  | "eviction_property_vs_filing_county"
  | "child_uccjea_outside_utah"
  | "smallclaims_no_link_to_county"
  | "namechange_must_be_residence"
  | "divorce_must_be_residence"

export interface VenueWarning {
  type: VenueViolationKind
  statute: string
  message_es: string
  message_en: string
}

export interface VenueValidationInput {
  serviceSlug: string
  filingCountyFips: string
  /**
   * Datos opcionales del caso para reglas service-specific. Vienen de
   * `cases.form_data` y `cases.beneficiary_data`. La función no lanza si faltan;
   * sólo omite la regla.
   */
  contextHints?: {
    propertyCountyFips?: string | null
    childResidesInUtah?: boolean | null
    petitionerResidesCountyFips?: string | null
  }
}

export function validateVenue(input: VenueValidationInput): VenueWarning[] {
  const warnings: VenueWarning[] = []
  const filingCounty = getCountyByFips(input.filingCountyFips)
  if (!filingCounty) {
    warnings.push({
      type: "smallclaims_no_link_to_county",
      statute: "78B-3a-201",
      message_es: "El condado seleccionado no es válido. Confirma tu elección.",
      message_en: "The selected county is not valid. Confirm your selection.",
    })
    return warnings
  }

  switch (input.serviceSlug) {
    case "eviction-defense": {
      const propCounty = input.contextHints?.propertyCountyFips
      if (propCounty && propCounty !== input.filingCountyFips) {
        warnings.push({
          type: "eviction_property_vs_filing_county",
          statute: "78B-3a-202",
          message_es:
            "Para casos de desalojo (unlawful detainer), el caso debe presentarse en el condado donde está la propiedad arrendada (UCA 78B-3a-202). Verifica con el self-help center.",
          message_en:
            "For unlawful detainer cases, the case must be filed in the county where the rental property is located (UCA 78B-3a-202). Verify with the self-help center.",
        })
      }
      break
    }
    case "child-custody": {
      if (input.contextHints?.childResidesInUtah === false) {
        warnings.push({
          type: "child_uccjea_outside_utah",
          statute: "78B-13-201",
          message_es:
            "Bajo UCCJEA, el caso de custodia debe presentarse en el estado de residencia del menor en los últimos 6 meses. Si el menor no vive en Utah, este distrito puede no tener jurisdicción.",
          message_en:
            "Under UCCJEA, custody must be filed in the child's home state during the past 6 months. If the child does not reside in Utah, this district may lack jurisdiction.",
        })
      }
      break
    }
    case "name-change":
    case "uncontested-divorce": {
      const residence = input.contextHints?.petitionerResidesCountyFips
      if (residence && residence !== input.filingCountyFips) {
        const isDivorce = input.serviceSlug === "uncontested-divorce"
        warnings.push({
          type: isDivorce ? "divorce_must_be_residence" : "namechange_must_be_residence",
          statute: isDivorce ? "78B-3a-201" : "42-1-1",
          message_es: isDivorce
            ? "Para divorcio el caso debe presentarse en el condado donde reside cualquiera de los cónyuges (UCA 78B-3a-201)."
            : "Para cambio de nombre el caso debe presentarse en el condado de tu residencia (Utah Code 42-1-1).",
          message_en: isDivorce
            ? "For divorce the case must be filed in the county where either spouse resides (UCA 78B-3a-201)."
            : "For name change the case must be filed in the county of your residence (Utah Code 42-1-1).",
        })
      }
      break
    }
    default:
      break
  }

  return warnings
}

/**
 * Recuperar la regla de venue oficial guardada en case_filing_procedures (texto
 * curado, source-of-truth). Útil para mostrar en la UI debajo del dropdown.
 */
export async function fetchVenueRule(
  serviceSlug: string,
): Promise<{ es: string; en: string; statute: string } | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("case_filing_procedures")
    .select("venue_rule_es, venue_rule_en, venue_statute_ref")
    .eq("service_slug", serviceSlug)
    .is("district_id", null)
    .eq("is_active", true)
    .maybeSingle()

  if (!data) return null
  return {
    es: data.venue_rule_es,
    en: data.venue_rule_en,
    statute: data.venue_statute_ref,
  }
}
