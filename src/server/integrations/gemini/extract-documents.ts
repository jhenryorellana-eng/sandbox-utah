import "server-only"
import { createServiceClient } from "@/lib/supabase/server"
import type { Json } from "@/shared/types/database"
import { extractFromImage } from "./client"
import {
  EXTRACTION_SCHEMA_DESCRIPTIONS,
  type ExtractionSchemaSlug,
  getExtractionSchema,
} from "./extraction-schemas"

const MAX_ATTEMPTS = 3

export interface ExtractDocumentResult {
  ok: boolean
  status: "extracted" | "extraction_failed" | "skipped"
  errorMessage?: string
  stub?: boolean
}

/**
 * Procesa un documento subido y extrae datos estructurados con Gemini Vision.
 * Idempotente: si ya está extracted/skipped, no re-procesa.
 */
export async function extractDocumentAsync(documentId: string): Promise<ExtractDocumentResult> {
  const service = createServiceClient()

  const { data: doc, error: fetchErr } = await service
    .from("documents")
    .select(
      "id, case_id, client_id, storage_path, mime_type, extraction_status, extraction_attempts, document_type_id",
    )
    .eq("id", documentId)
    .maybeSingle()
  if (fetchErr || !doc) {
    return { ok: false, status: "extraction_failed", errorMessage: "documento no encontrado" }
  }
  if (doc.extraction_status === "extracted" || doc.extraction_status === "skipped") {
    return { ok: true, status: doc.extraction_status }
  }
  if (doc.extraction_attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      status: "extraction_failed",
      errorMessage: "max attempts reached",
    }
  }

  const { data: docType } = await service
    .from("document_types")
    .select("extraction_schema_slug")
    .eq("id", doc.document_type_id ?? "")
    .maybeSingle()

  const schemaSlug = docType?.extraction_schema_slug as ExtractionSchemaSlug | null
  if (!schemaSlug) {
    await service
      .from("documents")
      .update({
        extraction_status: "skipped",
        extraction_error: "tipo de documento sin schema de extracción",
      })
      .eq("id", doc.id)
    return { ok: true, status: "skipped" }
  }
  const schema = getExtractionSchema(schemaSlug)
  if (!schema) {
    await service
      .from("documents")
      .update({
        extraction_status: "skipped",
        extraction_error: `schema "${schemaSlug}" no registrado`,
      })
      .eq("id", doc.id)
    return { ok: true, status: "skipped" }
  }

  await service
    .from("documents")
    .update({
      extraction_status: "extracting",
      extraction_attempts: doc.extraction_attempts + 1,
    })
    .eq("id", doc.id)

  // Descargar archivo de Storage como Buffer → base64
  const { data: blob, error: downloadErr } = await service.storage
    .from("case-documents")
    .download(doc.storage_path)
  if (downloadErr || !blob) {
    return setFailed(doc.id, downloadErr?.message ?? "no se pudo descargar")
  }
  const arrayBuffer = await blob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")

  const result = await extractFromImage<Record<string, unknown>>({
    imageBase64: base64,
    mimeType: doc.mime_type,
    schema,
    schemaName: schemaSlug,
    schemaDescription: EXTRACTION_SCHEMA_DESCRIPTIONS[schemaSlug],
  })

  await service.from("ai_interactions").insert({
    user_id: doc.client_id,
    case_id: doc.case_id,
    model: result.stub ? "stub" : "gemini-2.5-pro",
    task_type: "extract_document",
    blocked: !result.ok,
    block_reason: result.ok ? null : (result.errorMessage ?? null),
    function_call_name: schemaSlug,
    function_call_arguments: {
      documentId: doc.id,
      schemaSlug,
      stub: result.stub ?? false,
    } as Json,
  })

  if (!result.ok) {
    return setFailed(doc.id, result.errorMessage ?? "extraction failed")
  }

  await service
    .from("documents")
    .update({
      extraction_status: "extracted",
      extracted_data: (result.data ?? null) as Json | null,
      extracted_at: new Date().toISOString(),
      extraction_error: null,
    })
    .eq("id", doc.id)

  return { ok: true, status: "extracted", stub: result.stub ?? false }
}

async function setFailed(documentId: string, error: string): Promise<ExtractDocumentResult> {
  const service = createServiceClient()
  await service
    .from("documents")
    .update({
      extraction_status: "extraction_failed",
      extraction_error: error.slice(0, 500),
    })
    .eq("id", documentId)
  return { ok: false, status: "extraction_failed", errorMessage: error }
}
