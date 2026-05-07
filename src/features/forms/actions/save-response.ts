"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { getFormBySlug } from "@/server/legal/utah-courts/forms/registry"
import type { Json } from "@/shared/types/database"

const inputSchema = z.object({
  caseId: z.string().uuid(),
  formSlug: z.string().min(2),
  responses: z.record(z.string(), z.unknown()),
  submit: z.boolean().default(false),
})

export interface SaveFormResponseResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "not_found" | "form_not_found" | "schema_invalid" | "generic"
  errorMessages?: Record<string, string>
}

export async function saveFormResponseAction(input: unknown): Promise<SaveFormResponseResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const form = getFormBySlug(parsed.data.formSlug)
  if (!form) return { ok: false, errorCode: "form_not_found" }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, client_id")
    .eq("id", parsed.data.caseId)
    .eq("client_id", user.id)
    .maybeSingle()
  if (!caseRow) return { ok: false, errorCode: "not_found" }

  // Si submit=true, validamos completo. Si draft, permitimos parcial.
  if (parsed.data.submit) {
    const validation = form.schema.safeParse(parsed.data.responses)
    if (!validation.success) {
      const errorMessages: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const key = issue.path.join(".")
        if (key && !errorMessages[key]) errorMessages[key] = issue.message
      }
      return { ok: false, errorCode: "schema_invalid", errorMessages }
    }
  }

  return withCompliance(
    {
      action: parsed.data.submit ? "form_response.submitted" : "form_response.draft_saved",
      resourceType: "form_responses",
      userId: user.id,
      metadata: { caseId: parsed.data.caseId, formSlug: parsed.data.formSlug },
    },
    async (): Promise<SaveFormResponseResult> => {
      const service = createServiceClient()
      const { error } = await service.from("form_responses").upsert(
        {
          case_id: parsed.data.caseId,
          client_id: user.id,
          form_slug: parsed.data.formSlug,
          responses: parsed.data.responses as Json,
          status: parsed.data.submit ? "submitted" : "draft",
        },
        { onConflict: "case_id,form_slug" },
      )
      if (error) return { ok: false, errorCode: "generic" }

      revalidatePath(`/[locale]/cases/${parsed.data.caseId}/forms`, "page")
      return { ok: true }
    },
  )
}
