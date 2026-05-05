import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import type { AiTaskType, Json } from "@/shared/types/database"
import {
  callGeminiChat,
  extractFromImage,
  type GeminiChatOutput,
  type GeminiExtractInput,
  type GeminiExtractOutput,
} from "./client"
import {
  cannedResponse,
  classifyOutputAsAdvice,
  DEFENSIVE_SYSTEM_PROMPT,
  inspectInput,
} from "./guardrails"

interface ChatRequest {
  userId: string | null
  caseId: string | null
  message: string
  history: Array<{ role: "user" | "model"; text: string }>
  locale: "es" | "en"
}

export interface ChatResponse {
  text: string
  blocked: boolean
  blockReason: string | null
  guardrailsTriggered: string[]
  stub: boolean
}

async function logInteraction(input: {
  userId: string | null
  caseId: string | null
  taskType: AiTaskType
  model: string
  userMessage: string | null
  aiResponse: string | null
  guardrailsTriggered: string[]
  blocked: boolean
  blockReason: string | null
  promptTokens: number | null
  completionTokens: number | null
  latencyMs: number
  functionCallName?: string
  functionCallArguments?: Json | null
}): Promise<void> {
  const service = createServiceClient()
  const { error } = await service.from("ai_interactions").insert({
    user_id: input.userId,
    case_id: input.caseId,
    task_type: input.taskType,
    model: input.model,
    user_message: input.userMessage,
    ai_response: input.aiResponse,
    guardrails_triggered: input.guardrailsTriggered,
    blocked: input.blocked,
    block_reason: input.blockReason,
    prompt_tokens: input.promptTokens,
    completion_tokens: input.completionTokens,
    latency_ms: input.latencyMs,
    function_call_name: input.functionCallName ?? null,
    function_call_arguments: input.functionCallArguments ?? null,
  })
  if (error) console.error("[ai_interactions] log failed", error.message)
}

/**
 * Chat con guardrails 5 capas:
 *   1. Filtro keywords (inspectInput) — bloqueo pre-LLM.
 *   2. System prompt defensivo — pasado como systemInstruction.
 *   3. Safety settings BLOCK_LOW_AND_ABOVE.
 *   4. Output classifier post-hoc (classifyOutputAsAdvice).
 *   5. Audit log inmutable (ai_interactions).
 */
export async function chatWithLegalAssistant(input: ChatRequest): Promise<ChatResponse> {
  const start = Date.now()
  const model = "gemini-2.5-flash"

  // Capa 1: filtro pre-LLM
  const hits = inspectInput(input.message)
  if (hits.length > 0) {
    const category = hits[0]?.category ?? "advice"
    const text = cannedResponse(category, input.locale)
    await logInteraction({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "chat",
      model,
      userMessage: input.message,
      aiResponse: text,
      guardrailsTriggered: hits.map((h) => `pre:${h.category}`),
      blocked: true,
      blockReason: `pre_filter:${category}`,
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - start,
    })
    return {
      text,
      blocked: true,
      blockReason: `pre_filter:${category}`,
      guardrailsTriggered: hits.map((h) => h.category),
      stub: false,
    }
  }

  // Capa 2 + 3: system prompt + safety
  let result: GeminiChatOutput
  try {
    result = await callGeminiChat({
      model,
      systemPrompt: DEFENSIVE_SYSTEM_PROMPT,
      history: input.history,
      userMessage: input.message,
      safetyHigh: true,
    })
  } catch (err) {
    const text = cannedResponse("advice", input.locale)
    await logInteraction({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "chat",
      model,
      userMessage: input.message,
      aiResponse: null,
      guardrailsTriggered: ["error"],
      blocked: true,
      blockReason: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      promptTokens: null,
      completionTokens: null,
      latencyMs: Date.now() - start,
    })
    return {
      text,
      blocked: true,
      blockReason: "gemini_error",
      guardrailsTriggered: ["error"],
      stub: false,
    }
  }

  // Capa 4: output classifier
  if (classifyOutputAsAdvice(result.text)) {
    const text = cannedResponse("advice", input.locale)
    await logInteraction({
      userId: input.userId,
      caseId: input.caseId,
      taskType: "chat",
      model,
      userMessage: input.message,
      aiResponse: result.text,
      guardrailsTriggered: ["post:advice_detected"],
      blocked: true,
      blockReason: "output_classified_as_advice",
      promptTokens: result.promptTokens ?? null,
      completionTokens: result.completionTokens ?? null,
      latencyMs: Date.now() - start,
    })
    return {
      text,
      blocked: true,
      blockReason: "output_classified_as_advice",
      guardrailsTriggered: ["advice"],
      stub: result.stub ?? false,
    }
  }

  // Capa 5: audit log éxito
  await logInteraction({
    userId: input.userId,
    caseId: input.caseId,
    taskType: "chat",
    model,
    userMessage: input.message,
    aiResponse: result.text,
    guardrailsTriggered: [],
    blocked: false,
    blockReason: null,
    promptTokens: result.promptTokens ?? null,
    completionTokens: result.completionTokens ?? null,
    latencyMs: Date.now() - start,
  })

  return {
    text: result.text,
    blocked: false,
    blockReason: null,
    guardrailsTriggered: [],
    stub: result.stub ?? false,
  }
}

/**
 * Wrapper de extracción multimodal con audit log.
 */
export async function extractDocumentForUser<T>(
  userId: string,
  caseId: string | null,
  schemaName: string,
  input: GeminiExtractInput<T>,
): Promise<GeminiExtractOutput<T>> {
  const start = Date.now()
  const result = await extractFromImage(input)

  await logInteraction({
    userId,
    caseId,
    taskType: "extract_document",
    model: "gemini-2.5-pro",
    userMessage: null,
    aiResponse: result.ok ? "(structured)" : (result.errorMessage ?? null),
    guardrailsTriggered: [],
    blocked: !result.ok,
    blockReason: result.ok ? null : (result.errorMessage ?? "extraction_failed"),
    promptTokens: null,
    completionTokens: null,
    latencyMs: Date.now() - start,
    functionCallName: schemaName,
    functionCallArguments: result.ok ? (result.data as unknown as Json) : null,
  })

  return result
}
