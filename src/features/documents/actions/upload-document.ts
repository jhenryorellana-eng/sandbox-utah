"use server"

import { createHash } from "node:crypto"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { extractDocumentAsync } from "@/server/integrations/gemini/extract-documents"

const ALLOWED_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024

const inputSchema = z.object({
  caseId: z.string().uuid(),
  documentTypeId: z.string().uuid(),
  minorId: z.string().uuid().nullish(),
})

export interface UploadDocumentResult {
  ok: boolean
  documentId?: string
  errorCode?:
    | "auth"
    | "validation"
    | "case_not_found"
    | "doc_type_not_found"
    | "file_too_large"
    | "invalid_type"
    | "minor_mismatch"
    | "generic"
  errorMessage?: string
}

export async function uploadDocumentAction(formData: FormData): Promise<UploadDocumentResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const parsed = inputSchema.safeParse({
    caseId: formData.get("caseId"),
    documentTypeId: formData.get("documentTypeId"),
    minorId: formData.get("minorId") || null,
  })
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errorCode: "validation" }
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, client_id")
    .eq("id", parsed.data.caseId)
    .eq("client_id", user.id)
    .maybeSingle()
  if (!caseRow) return { ok: false, errorCode: "case_not_found" }

  const { data: docType } = await supabase
    .from("document_types")
    .select("id, slug, accepts_file_types, max_size_bytes, is_per_minor, extraction_schema_slug")
    .eq("id", parsed.data.documentTypeId)
    .maybeSingle()
  if (!docType) return { ok: false, errorCode: "doc_type_not_found" }

  if (file.size > (docType.max_size_bytes ?? DEFAULT_MAX_BYTES)) {
    return { ok: false, errorCode: "file_too_large" }
  }
  const acceptedTypes =
    docType.accepts_file_types && docType.accepts_file_types.length > 0
      ? docType.accepts_file_types
      : ALLOWED_TYPES
  if (!acceptedTypes.includes(file.type)) {
    return { ok: false, errorCode: "invalid_type" }
  }

  let minorLabel: string | null = null
  if (docType.is_per_minor) {
    if (!parsed.data.minorId) return { ok: false, errorCode: "minor_mismatch" }
    const { data: minor } = await supabase
      .from("case_minors")
      .select("id, full_name, case_id")
      .eq("id", parsed.data.minorId)
      .eq("case_id", parsed.data.caseId)
      .maybeSingle()
    if (!minor) return { ok: false, errorCode: "minor_mismatch" }
    minorLabel = minor.full_name
  } else if (parsed.data.minorId) {
    return { ok: false, errorCode: "minor_mismatch" }
  }

  return withCompliance(
    {
      action: "document.uploaded",
      resourceType: "documents",
      userId: user.id,
      metadata: {
        caseId: parsed.data.caseId,
        docTypeSlug: docType.slug,
        minorId: parsed.data.minorId ?? null,
      },
    },
    async (): Promise<UploadDocumentResult> => {
      const buf = Buffer.from(await file.arrayBuffer())
      const sha256 = createHash("sha256").update(buf).digest("hex")
      const ext = guessExtension(file.type) ?? "bin"

      const service = createServiceClient()
      const { data: docRow, error: insertErr } = await service
        .from("documents")
        .insert({
          case_id: parsed.data.caseId,
          client_id: user.id,
          document_type_id: docType.id,
          minor_id: parsed.data.minorId ?? null,
          minor_label: minorLabel,
          storage_path: "pending",
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          sha256_hash: sha256,
          uploaded_by: user.id,
          status: "uploaded",
          extraction_status: docType.extraction_schema_slug ? "pending" : "skipped",
        })
        .select("id")
        .single()
      if (insertErr || !docRow) {
        return {
          ok: false,
          errorCode: "generic",
          errorMessage: insertErr?.message ?? "insert failed",
        }
      }

      const storagePath = `${user.id}/${parsed.data.caseId}/${docRow.id}.${ext}`
      const { error: upErr } = await service.storage
        .from("case-documents")
        .upload(storagePath, buf, { contentType: file.type, upsert: false })
      if (upErr) {
        await service.from("documents").delete().eq("id", docRow.id)
        return { ok: false, errorCode: "generic", errorMessage: upErr.message }
      }

      const { error: updErr } = await service
        .from("documents")
        .update({ storage_path: storagePath })
        .eq("id", docRow.id)
      if (updErr) {
        return { ok: false, errorCode: "generic", errorMessage: updErr.message }
      }

      await appendCaseActivity({
        caseId: parsed.data.caseId,
        actorId: user.id,
        actorType: "client",
        activityType: "document.uploaded",
        description: `Documento subido: ${file.name}`,
        metadata: {
          document_id: docRow.id,
          document_type_slug: docType.slug,
          minor_id: parsed.data.minorId ?? null,
          minor_label: minorLabel,
        },
      })

      revalidatePath(`/[locale]/cases/${parsed.data.caseId}/documents`, "page")

      // Trigger extracción IA en background si el tipo tiene schema
      if (docType.extraction_schema_slug) {
        after(async () => {
          try {
            await extractDocumentAsync(docRow.id)
          } catch (err) {
            console.error("[extractDocumentAsync] failed", err)
          }
        })
      }

      return { ok: true, documentId: docRow.id }
    },
  )
}

function guessExtension(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "application/pdf":
      return "pdf"
    default:
      return null
  }
}
