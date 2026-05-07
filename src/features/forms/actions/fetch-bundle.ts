"use server"

import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { getFormBySlug } from "@/server/legal/utah-courts/forms/registry"
import type { Json } from "@/shared/types/database"

export interface FormBundleField {
  name: string
  label_es: string
  label_en: string
  required: boolean
  multiline: boolean
}

export interface FormBundleGroup {
  title_es: string
  title_en: string
  fields: FormBundleField[]
}

export interface FormBundleResult {
  ok: boolean
  errorCode?: "auth" | "not_found" | "case_not_found" | "form_not_found" | "generic"
  formSlug?: string
  name_es?: string
  name_en?: string
  groups?: FormBundleGroup[]
  values?: Record<string, unknown>
  sources?: Record<string, { from: string; refId?: string } | null>
  responseId?: string
  status?: string
}

export async function fetchFormBundle(caseId: string, formSlug: string): Promise<FormBundleResult> {
  if (!caseId || !formSlug) return { ok: false, errorCode: "not_found" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const form = getFormBySlug(formSlug)
  if (!form) return { ok: false, errorCode: "form_not_found" }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, client_id, intake_status")
    .eq("id", caseId)
    .eq("client_id", user.id)
    .maybeSingle()
  if (!caseRow) return { ok: false, errorCode: "case_not_found" }

  return withCompliance(
    {
      action: "form.bundle_loaded",
      resourceType: "form_responses",
      userId: user.id,
      metadata: { caseId, formSlug },
    },
    async (): Promise<FormBundleResult> => {
      const service = createServiceClient()
      const { data: existing } = await service
        .from("form_responses")
        .select("id, responses, prefilled_from, status")
        .eq("case_id", caseId)
        .eq("form_slug", formSlug)
        .maybeSingle()

      let values: Record<string, unknown>
      let sources: Record<string, { from: string; refId?: string } | null>
      let responseId: string | null = existing?.id ?? null
      let status = existing?.status ?? "draft"

      if (existing) {
        values = (existing.responses as Record<string, unknown>) ?? {}
        sources =
          (existing.prefilled_from as Record<string, { from: string; refId?: string } | null>) ?? {}
      } else {
        const prefill = await form.prefill({ caseId, clientId: user.id })
        values = prefill.values as Record<string, unknown>
        sources = prefill.sources as Record<string, { from: string; refId?: string } | null>
        const { data: row, error: insertErr } = await service
          .from("form_responses")
          .insert({
            case_id: caseId,
            client_id: user.id,
            form_slug: formSlug,
            responses: values as Json,
            prefilled_from: sources as Json,
            status: "draft",
          })
          .select("id, status")
          .single()
        if (insertErr || !row) {
          return { ok: false, errorCode: "generic" }
        }
        responseId = row.id
        status = row.status
      }

      // Zod 4: ZodObject expone `.shape` directamente como objeto (no función).
      const shape = extractShape(form.schema)
      const groups: FormBundleGroup[] = form.fieldGroups.map((g) => ({
        title_es: g.title_es,
        title_en: g.title_en,
        fields: g.fields.map((fieldName) => {
          const fieldKey = fieldName as string
          const label = form.fieldLabels[fieldName as never] as
            | { es: string; en: string }
            | undefined
          const fieldSchema = shape[fieldKey]
          const required = isRequired(fieldSchema)
          const multiline = fieldKey.includes("summary") || fieldKey.includes("address")
          return {
            name: fieldKey,
            label_es: label?.es ?? fieldKey,
            label_en: label?.en ?? fieldKey,
            required,
            multiline,
          }
        }),
      }))

      const result: FormBundleResult = {
        ok: true,
        formSlug: form.slug,
        name_es: form.name_es,
        name_en: form.name_en,
        groups,
        values,
        sources,
        status,
      }
      if (responseId) result.responseId = responseId
      return result
    },
  )
}

function extractShape(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== "object") return {}
  const direct = (schema as { shape?: unknown }).shape
  if (direct && typeof direct === "object") return direct as Record<string, unknown>
  const defShape = (schema as { _def?: { shape?: unknown } })._def?.shape
  if (typeof defShape === "function") {
    return (defShape as () => Record<string, unknown>)()
  }
  if (defShape && typeof defShape === "object") return defShape as Record<string, unknown>
  return {}
}

function isRequired(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") return false
  const def = (schema as { _def?: { type?: string; typeName?: string } })._def
  if (!def) return false
  // Zod 3: typeName='ZodOptional'/'ZodNullable'/'ZodNullish'
  // Zod 4: type='optional'/'nullable'/'nullish'
  const marker = def.typeName ?? def.type ?? ""
  if (/optional|nullable|nullish/i.test(marker)) return false
  return true
}
