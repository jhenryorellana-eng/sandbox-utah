import "server-only"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"
import type { AiTaskType, FilingWarning, Json } from "@/shared/types/database"
import { callGeminiChat, type GeminiChatOutput } from "./client"
import {
  buildGroundingUserMessage,
  FILING_NARRATOR_SYSTEM_PROMPT,
  type GroundingInput,
  getAllowedFormCodes,
} from "./filing-grounding"
import { classifyOutputAsAdvice, inspectInput, validateFormCodesInOutput } from "./guardrails"

/**
 * Genera narrativa bilingüe + warnings para un packet usando Gemini con grounding
 * estricto a la data autoritativa. Se ejecuta una sola vez por packet (cache en
 * `case_filing_packets.ai_narrative_*`).
 *
 * Implementa las 6 capas de guardrails:
 *   1. inspectInput sobre el contexto (defensa contra injection en service names).
 *   2. system prompt defensivo + grounding estricto (whitelist explícita).
 *   3. safety settings BLOCK_LOW_AND_ABOVE.
 *   4. classifyOutputAsAdvice — si el modelo dio asesoría, fallback determinístico.
 *   5. audit log inmutable en ai_interactions.
 *   6. validateFormCodesInOutput — ningún form_code fuera de la whitelist.
 */

const FilingNarratorSchema = z.object({
  narrative_es: z.string().min(50).max(4000),
  narrative_en: z.string().min(50).max(4000),
  warnings: z
    .array(
      z.object({
        type: z.string().min(1).max(80),
        message_es: z.string().min(1).max(500),
        message_en: z.string().min(1).max(500),
      }),
    )
    .max(10)
    .default([]),
})

export type FilingNarratorOutput = z.infer<typeof FilingNarratorSchema>

export interface NarrateFilingInput extends GroundingInput {
  /** Para audit log */
  caseId: string | null
  userId: string | null
}

export interface NarrateFilingResult {
  narrative_es: string
  narrative_en: string
  warnings: FilingWarning[]
  blocked: boolean
  blockReason: string | null
  model: string
  stub: boolean
}

const MODEL = "gemini-2.5-flash"

async function logFiling(input: {
  userId: string | null
  caseId: string | null
  taskType: AiTaskType
  userMessage: string | null
  aiResponse: string | null
  guardrailsTriggered: string[]
  blocked: boolean
  blockReason: string | null
  promptTokens: number | null
  completionTokens: number | null
  latencyMs: number
  metadata: Json | null
}): Promise<void> {
  const service = createServiceClient()
  const { error } = await service.from("ai_interactions").insert({
    user_id: input.userId,
    case_id: input.caseId,
    task_type: input.taskType,
    model: MODEL,
    user_message: input.userMessage,
    ai_response: input.aiResponse,
    guardrails_triggered: input.guardrailsTriggered,
    blocked: input.blocked,
    block_reason: input.blockReason,
    prompt_tokens: input.promptTokens,
    completion_tokens: input.completionTokens,
    latency_ms: input.latencyMs,
    function_call_name: "filing_narrator",
    function_call_arguments: input.metadata,
  })
  if (error) console.error("[filing-narrator] log failed", error.message)
}

function deterministicFallback(input: GroundingInput): NarrateFilingResult {
  const intakeStepsEs = input.intakeStepsEs
    .map((s) => `${s.step}. ${s.title}: ${s.detail}`)
    .join(" ")
  const intakeStepsEn = input.intakeStepsEn
    .map((s) => `${s.step}. ${s.title}: ${s.detail}`)
    .join(" ")
  return {
    narrative_es: `Tu caso de ${input.serviceNameEs} se radica en el ${input.districtNameEs} (condado de ${input.countyName}). Etapa 1 — Radicación de la presentación: ${intakeStepsEs}`,
    narrative_en: `Your ${input.serviceNameEn} case is filed in the ${input.districtNameEn} (${input.countyName} county). Stage 1 — Filing intake: ${intakeStepsEn}`,
    warnings: [],
    blocked: false,
    blockReason: null,
    model: `${MODEL}/stub`,
    stub: true,
  }
}

export async function narrateFiling(input: NarrateFilingInput): Promise<NarrateFilingResult> {
  const start = Date.now()
  const userMessage = buildGroundingUserMessage(input)
  const allowedCodes = getAllowedFormCodes(input.forms)

  // Capa 1: pre-filter del contexto. Si algún campo del input dispara el
  // filtro (ej: alguien intenta inyectar "visa" en el service name), abortamos.
  const hits = inspectInput(`${input.serviceNameEs} ${input.serviceNameEn} ${input.countyName}`)
  if (hits.length > 0) {
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: null,
      guardrailsTriggered: hits.map((h) => `pre:${h.category}`),
      blocked: true,
      blockReason: `pre_filter:${hits[0]?.category ?? "advice"}`,
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - start,
      metadata: { service_slug: input.serviceSlug, district_id: input.districtId } as Json,
    })
    const fallback = deterministicFallback(input)
    return { ...fallback, blocked: true, blockReason: "pre_filter" }
  }

  // Capa 2 + 3: llamar a Gemini con grounding
  let geminiOutput: GeminiChatOutput
  try {
    geminiOutput = await callGeminiChat({
      model: MODEL,
      systemPrompt: FILING_NARRATOR_SYSTEM_PROMPT,
      history: [],
      userMessage,
      safetyHigh: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : "unknown"
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: null,
      guardrailsTriggered: ["error"],
      blocked: true,
      blockReason: msg,
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - start,
      metadata: { error: msg } as Json,
    })
    const fallback = deterministicFallback(input)
    return { ...fallback, blocked: true, blockReason: "gemini_error" }
  }

  // Stub mode: devolver fallback determinístico
  if (geminiOutput.stub) {
    const fallback = deterministicFallback(input)
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: fallback.narrative_es,
      guardrailsTriggered: ["stub"],
      blocked: false,
      blockReason: null,
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - start,
      metadata: { stub: true } as Json,
    })
    return fallback
  }

  // Parsear JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFences(geminiOutput.text))
  } catch {
    const fallback = deterministicFallback(input)
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: geminiOutput.text,
      guardrailsTriggered: ["json_parse_failed"],
      blocked: true,
      blockReason: "json_parse_failed",
      promptTokens: geminiOutput.promptTokens ?? null,
      completionTokens: geminiOutput.completionTokens ?? null,
      latencyMs: Date.now() - start,
      metadata: null,
    })
    return { ...fallback, blocked: true, blockReason: "json_parse_failed" }
  }

  const validation = FilingNarratorSchema.safeParse(parsed)
  if (!validation.success) {
    const fallback = deterministicFallback(input)
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: geminiOutput.text,
      guardrailsTriggered: ["zod_validation_failed"],
      blocked: true,
      blockReason: "zod_validation_failed",
      promptTokens: geminiOutput.promptTokens ?? null,
      completionTokens: geminiOutput.completionTokens ?? null,
      latencyMs: Date.now() - start,
      metadata: { issues: validation.error.issues.slice(0, 3).map((i) => i.message) } as Json,
    })
    return { ...fallback, blocked: true, blockReason: "zod_validation_failed" }
  }

  const data = validation.data

  // Capa 4: classifyOutputAsAdvice
  const combined = `${data.narrative_es}\n${data.narrative_en}`
  if (classifyOutputAsAdvice(combined)) {
    const fallback = deterministicFallback(input)
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: combined,
      guardrailsTriggered: ["post:advice_detected"],
      blocked: true,
      blockReason: "output_classified_as_advice",
      promptTokens: geminiOutput.promptTokens ?? null,
      completionTokens: geminiOutput.completionTokens ?? null,
      latencyMs: Date.now() - start,
      metadata: null,
    })
    return { ...fallback, blocked: true, blockReason: "output_classified_as_advice" }
  }

  // Capa 6: form code whitelist
  const codeCheck = validateFormCodesInOutput(combined, allowedCodes)
  if (!codeCheck.ok) {
    const fallback = deterministicFallback(input)
    await logFiling({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "filing_narrative",
      userMessage,
      aiResponse: combined,
      guardrailsTriggered: ["post:form_code_leak"],
      blocked: true,
      blockReason: "form_code_not_in_whitelist",
      promptTokens: geminiOutput.promptTokens ?? null,
      completionTokens: geminiOutput.completionTokens ?? null,
      latencyMs: Date.now() - start,
      metadata: { leaked: codeCheck.leaked } as Json,
    })
    return { ...fallback, blocked: true, blockReason: "form_code_not_in_whitelist" }
  }

  // Capa 5: audit éxito
  await logFiling({
    userId: input.userId,
    caseId: input.caseId,
    taskType: "filing_narrative",
    userMessage,
    aiResponse: combined,
    guardrailsTriggered: [],
    blocked: false,
    blockReason: null,
    promptTokens: geminiOutput.promptTokens ?? null,
    completionTokens: geminiOutput.completionTokens ?? null,
    latencyMs: Date.now() - start,
    metadata: { service_slug: input.serviceSlug, district_id: input.districtId } as Json,
  })

  return {
    narrative_es: data.narrative_es,
    narrative_en: data.narrative_en,
    warnings: data.warnings,
    blocked: false,
    blockReason: null,
    model: MODEL,
    stub: false,
  }
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}
