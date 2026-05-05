"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

export interface RecordConsentsResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "generic"
  errorMessage?: string
}

const REQUIRED_KEYS = [
  "is_utah_resident",
  "not_a_law_firm",
  "no_legal_advice",
  "no_immigration",
  "accuracy_responsibility",
  "ai_usage",
  "complaint_rights",
  "tos_privacy",
] as const

interface ConsentInput {
  key: (typeof REQUIRED_KEYS)[number]
  version: string
  textSnapshot: string
  locale: "es" | "en"
}

/**
 * Inserta los 8 consents para el usuario actual. Cada uno es inmutable
 * (RULES no-update/no-delete a nivel DB). El llamador es responsable de
 * pasar los textos exactos de messages/{locale}.json#Consents.items.
 */
export async function recordConsentsAction(
  consents: ConsentInput[],
): Promise<RecordConsentsResult> {
  const keys = new Set(consents.map((c) => c.key))
  for (const required of REQUIRED_KEYS) {
    if (!keys.has(required)) return { ok: false, errorCode: "validation" }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  return withCompliance(
    {
      action: "onboarding.consents_recorded",
      resourceType: "consents",
      userId: user.id,
      metadata: { count: consents.length },
    },
    async (): Promise<RecordConsentsResult> => {
      const rows = consents.map((c) => ({
        user_id: user.id,
        consent_key: c.key,
        consent_version: c.version,
        text_snapshot: c.textSnapshot,
        locale: c.locale,
      }))
      const { error } = await supabase
        .from("consents")
        .upsert(rows, { onConflict: "user_id,consent_key,consent_version", ignoreDuplicates: true })

      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }
      return { ok: true }
    },
  )
}
