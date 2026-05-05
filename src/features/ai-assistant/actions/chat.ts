"use server"

import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { chatWithLegalAssistant } from "@/server/integrations/gemini/legal-assistant"

const chatInput = z.object({
  caseId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .default([]),
})

export interface ChatActionResult {
  ok: boolean
  text?: string
  blocked?: boolean
  blockReason?: string
  guardrailsTriggered?: string[]
  errorCode?: "auth" | "validation" | "generic"
  errorMessage?: string
}

export async function chatWithAssistantAction(input: unknown): Promise<ChatActionResult> {
  const parsed = chatInput.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single()
  const locale: "es" | "en" = profile?.preferred_language === "en" ? "en" : "es"

  return withCompliance(
    {
      action: "ai.chat",
      resourceType: "ai_interactions",
      userId: user.id,
      metadata: {
        caseId: parsed.data.caseId ?? null,
        messageLength: parsed.data.message.length,
        historyLength: parsed.data.history.length,
      },
    },
    async (): Promise<ChatActionResult> => {
      const result = await chatWithLegalAssistant({
        userId: user.id,
        caseId: parsed.data.caseId ?? null,
        message: parsed.data.message,
        history: parsed.data.history,
        locale,
      })
      return {
        ok: true,
        text: result.text,
        blocked: result.blocked,
        ...(result.blockReason ? { blockReason: result.blockReason } : {}),
        guardrailsTriggered: result.guardrailsTriggered,
      }
    },
  )
}
