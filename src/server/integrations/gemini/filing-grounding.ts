import "server-only"
import type { FilingFormSnapshot, FilingStep } from "@/shared/types/database"

/**
 * Construye el prompt de grounding para Gemini, inyectando la data autoritativa
 * de `case_filing_procedures` + `official_court_forms` como JSON. El modelo
 * NUNCA debe inventar pasos o form_codes; sólo NARRAR lo que está aquí.
 */

export interface GroundingInput {
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
  venueRuleEs: string
  venueRuleEn: string
  venueStatuteRef: string
  sourceUrls: string[]
}

export const FILING_NARRATOR_SYSTEM_PROMPT = `Eres un narrador legal-tech bajo el Utah Legal Sandbox Phase 2.

OBJETIVO: convertir un procedimiento estructurado de radicación en una narrativa empática y clara para un cliente latino, en español Y en inglés.

REGLAS ABSOLUTAS:

1. NO ERES UN ABOGADO. NO DAS ASESORÍA. Sólo narras lo que ya está escrito en el JSON estructurado.

2. NO INVENTES NADA. Está PROHIBIDO mencionar:
   - Form codes que no estén en <<allowed_forms>>.
   - Filing fees distintos al del JSON.
   - URLs externas que no estén en <<allowed_sources>>.
   - Pasos adicionales más allá de los listados.
   Si necesitas mencionar un form, debe aparecer literal en <<allowed_forms>>.

3. NO MANEJAS INMIGRACIÓN. Si el contexto sugiere algo migratorio (visa, USCIS, deportación, etc.), responde sólo: "Esta plataforma no maneja temas de inmigración."

4. TONO: empático, claro, sin jerga legal. Usa "tú" en español, "you" en inglés. Dirígete al cliente directamente.

5. ESTRUCTURA OBLIGATORIA del output JSON (no añadas claves):
   {
     "narrative_es": "<2-3 párrafos cortos en español>",
     "narrative_en": "<2-3 párrafos cortos en inglés>",
     "warnings": [{ "type": "<tipo>", "message_es": "<mensaje>", "message_en": "<message>" }]
   }

6. TRANSPARENCIA: si te preguntan, eres Google Gemini.

7. CONFIDENCIALIDAD: NO menciones datos personales del cliente más allá de los provistos en el contexto. NO inventes precedentes. Si no sabes algo, omítelo.`

export function buildGroundingUserMessage(input: GroundingInput): string {
  const allowedForms = input.forms.map((f) => f.form_code).join(", ")
  const allowedSources = input.sourceUrls.join(", ")
  return [
    "<<allowed_forms>>",
    allowedForms || "(ninguno)",
    "<<allowed_sources>>",
    allowedSources || "(ninguno)",
    "<<context>>",
    JSON.stringify(
      {
        service: {
          slug: input.serviceSlug,
          name_es: input.serviceNameEs,
          name_en: input.serviceNameEn,
        },
        district: {
          id: input.districtId,
          name_es: input.districtNameEs,
          name_en: input.districtNameEn,
          county: input.countyName,
        },
        intake_channel: input.intakeChannel,
        intake_fee_cents: input.intakeFeeCents,
        venue: {
          es: input.venueRuleEs,
          en: input.venueRuleEn,
          statute: input.venueStatuteRef,
        },
        intake_steps_es: input.intakeStepsEs,
        intake_steps_en: input.intakeStepsEn,
        case_steps_es: input.caseStepsEs,
        case_steps_en: input.caseStepsEn,
        forms: input.forms.map((f) => ({
          code: f.form_code,
          name_es: f.name_es,
          name_en: f.name_en,
          mandatory: f.is_mandatory,
        })),
      },
      null,
      2,
    ),
    "",
    "Devuelve SÓLO el JSON con narrative_es, narrative_en, warnings. Nada más.",
  ].join("\n")
}

export function getAllowedFormCodes(forms: FilingFormSnapshot[]): string[] {
  return forms.map((f) => f.form_code.toUpperCase())
}
