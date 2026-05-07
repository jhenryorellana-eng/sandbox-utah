import "server-only"

import type { z } from "zod"
import { prefillDemoPetition } from "./custody/demo-petition/prefill"
import {
  DEMO_PETITION_FIELD_GROUPS,
  DEMO_PETITION_FIELD_LABELS,
  type DemoPetitionValues,
  demoPetitionSchema,
} from "./custody/demo-petition/schema"

export interface FormFieldLabel {
  es: string
  en: string
}

export interface FormFieldGroup<TValues extends Record<string, unknown>> {
  title_es: string
  title_en: string
  fields: Array<keyof TValues>
}

export interface PrefillContext {
  caseId: string
  clientId: string
}

export interface PrefillResult<TValues extends Record<string, unknown>> {
  values: Partial<TValues>
  sources: Record<keyof TValues, { from: string; refId?: string } | null>
}

export interface FormDefinition<TValues extends Record<string, unknown>> {
  slug: string
  name_es: string
  name_en: string
  serviceSlugs: string[]
  districts: number[] | "all"
  schema: z.ZodTypeAny
  fieldLabels: Record<keyof TValues, FormFieldLabel>
  fieldGroups: ReadonlyArray<FormFieldGroup<TValues>>
  prefill: (ctx: PrefillContext) => Promise<PrefillResult<TValues>>
  pdfTemplatePath: string | null
  version: string
}

export type AnyFormDefinition = FormDefinition<Record<string, unknown>>

const DEMO_PETITION: FormDefinition<DemoPetitionValues> = {
  slug: "utah-custody-demo-petition",
  name_es: "Petición de Custodia (demo)",
  name_en: "Custody Petition (demo)",
  serviceSlugs: ["child-custody"],
  districts: "all",
  schema: demoPetitionSchema,
  fieldLabels: DEMO_PETITION_FIELD_LABELS,
  fieldGroups: DEMO_PETITION_FIELD_GROUPS,
  prefill: prefillDemoPetition as FormDefinition<DemoPetitionValues>["prefill"],
  pdfTemplatePath: null,
  version: "demo-2026.05",
}

export const FORM_REGISTRY: ReadonlyArray<AnyFormDefinition> = [
  DEMO_PETITION as unknown as AnyFormDefinition,
]

export function listFormsForCase(
  serviceSlug: string,
  districtId: number | null,
): AnyFormDefinition[] {
  return FORM_REGISTRY.filter((f) => f.serviceSlugs.includes(serviceSlug)).filter((f) => {
    if (f.districts === "all") return true
    if (districtId === null) return true
    return f.districts.includes(districtId)
  })
}

export function getFormBySlug(slug: string): AnyFormDefinition | null {
  return FORM_REGISTRY.find((f) => f.slug === slug) ?? null
}
