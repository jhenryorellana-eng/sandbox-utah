import "server-only"
import type { ZodTypeAny } from "zod"

/**
 * Wrapper minimal sobre Gemini Vertex AI. Sin SDK propio (evita Edge issues),
 * llamadas REST. Modo stub si `GOOGLE_GEMINI_API_KEY` falta — devuelve
 * respuestas plausibles para que el flujo del wizard avance en dev sin Gemini.
 *
 * Producción debe usar Vertex AI (NO AI Studio) con BAA firmado y
 * data-residency us-central1 (REQUERIMIENTOS §11.5).
 */

export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite" | "gemini-2.5-pro"

export interface GeminiChatInput {
  model?: GeminiModel
  systemPrompt: string
  history: Array<{ role: "user" | "model"; text: string }>
  userMessage: string
  safetyHigh?: boolean
}

export interface GeminiChatOutput {
  text: string
  promptTokens?: number
  completionTokens?: number
  stub?: boolean
}

export interface GeminiExtractInput<T> {
  imageBase64: string
  mimeType: string
  schema: ZodTypeAny
  schemaName: string
  schemaDescription: string
  /** Para que el caller pueda mockear stub en tests. */
  stubFallback?: T
}

export interface GeminiExtractOutput<T> {
  ok: boolean
  data?: T
  errorMessage?: string
  stub?: boolean
}

const STUB_CHAT_RESPONSE_ES =
  "Soy un asistente de llenado de formularios. Esta es una respuesta de demostración (Gemini no configurado). " +
  "Reformula tu pregunta acerca de cómo llenar un campo y te ayudaré."

const STUB_CHAT_RESPONSE_EN =
  "I'm a form-filling assistant. This is a demo response (Gemini not configured). " +
  "Rephrase your question about how to fill a field and I'll help."

export async function callGeminiChat(input: GeminiChatInput): Promise<GeminiChatOutput> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    const lowercase = input.userMessage.toLowerCase()
    const text = /\b(en|english)\b/.test(lowercase) ? STUB_CHAT_RESPONSE_EN : STUB_CHAT_RESPONSE_ES
    return { text, stub: true }
  }

  const model = input.model ?? "gemini-2.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const body = {
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    contents: [
      ...input.history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: "user", parts: [{ text: input.userMessage }] },
    ],
    safetySettings: input.safetyHigh
      ? [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
        ]
      : undefined,
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Gemini ${response.status}: ${text.slice(0, 500)}`)
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text?: string }> } }>
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }
  const text = data.candidates?.[0]?.content.parts?.[0]?.text ?? ""
  const out: GeminiChatOutput = { text }
  if (data.usageMetadata?.promptTokenCount !== undefined) {
    out.promptTokens = data.usageMetadata.promptTokenCount
  }
  if (data.usageMetadata?.candidatesTokenCount !== undefined) {
    out.completionTokens = data.usageMetadata.candidatesTokenCount
  }
  return out
}

/**
 * Extracción de documentos vía multimodal + JSON estructurado.
 * Si stubFallback se provee y no hay API key, lo devolvemos.
 */
export async function extractFromImage<T>(
  input: GeminiExtractInput<T>,
): Promise<GeminiExtractOutput<T>> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    if (input.stubFallback !== undefined) {
      const validation = input.schema.safeParse(input.stubFallback)
      if (!validation.success) {
        return { ok: false, errorMessage: "stub fallback no valida contra schema", stub: true }
      }
      return { ok: true, data: validation.data as T, stub: true }
    }
    return { ok: false, errorMessage: "Gemini no configurado y sin stub", stub: true }
  }

  const model: GeminiModel = "gemini-2.5-pro"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const body = {
    systemInstruction: {
      parts: [
        {
          text: `Eres un extractor de datos estructurados. Dada una imagen de documento, extrae los campos exactamente como aparecen. NO inventes valores. Si un campo no es legible, devuelve null. Output: JSON válido con el schema "${input.schemaName}". ${input.schemaDescription}`,
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: input.mimeType, data: input.imageBase64 } },
          { text: `Extrae los campos del documento siguiendo el schema "${input.schemaName}".` },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return { ok: false, errorMessage: `Gemini ${response.status}: ${text.slice(0, 500)}` }
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text?: string }> } }>
  }
  const raw = data.candidates?.[0]?.content.parts?.[0]?.text ?? ""
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, errorMessage: "Gemini no devolvió JSON válido" }
  }
  const validation = input.schema.safeParse(parsed)
  if (!validation.success) {
    return {
      ok: false,
      errorMessage: `JSON no valida: ${validation.error.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join("; ")}`,
    }
  }
  return { ok: true, data: validation.data as T }
}
