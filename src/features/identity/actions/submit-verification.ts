"use server"

import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const
const MAX_BYTES = 10 * 1024 * 1024

export interface SubmitVerificationResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "file_too_large" | "invalid_type" | "generic"
  errorMessage?: string
  verificationId?: string
}

/**
 * Recibe los archivos del cliente, los sube al bucket privado
 * `identity-documents` bajo `<user_id>/<verification_id>/...` y crea/actualiza
 * la fila en `identity_verifications` con status='submitted' (admin review).
 */
export async function submitVerificationAction(
  formData: FormData,
): Promise<SubmitVerificationResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const front = formData.get("front")
  const back = formData.get("back")
  const proof = formData.get("proof")

  if (!(front instanceof File) || !(back instanceof File)) {
    return { ok: false, errorCode: "validation" }
  }

  for (const file of [front, back, proof].filter(
    (x): x is File => x instanceof File && x.size > 0,
  )) {
    if (file.size > MAX_BYTES) return { ok: false, errorCode: "file_too_large" }
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return { ok: false, errorCode: "invalid_type" }
    }
  }

  return withCompliance(
    {
      action: "identity.verification_submitted",
      resourceType: "identity_verifications",
      userId: user.id,
      piiAccessed: true,
    },
    async (): Promise<SubmitVerificationResult> => {
      // Crear la fila para tener verification_id estable
      const { data: row, error: insertErr } = await supabase
        .from("identity_verifications")
        .insert({ user_id: user.id, status: "submitted" })
        .select("id")
        .single()
      if (insertErr || !row) {
        return {
          ok: false,
          errorCode: "generic",
          errorMessage: insertErr?.message ?? "insert failed",
        }
      }
      const verificationId = row.id

      // Subir archivos via service-role (RLS de storage ya restringe folder por user_id,
      // pero el server tiene acceso completo y conoce el path correcto)
      const service = createServiceClient()
      const uploads: { field: keyof typeof paths; file: File }[] = [
        { field: "document_front_path", file: front },
        { field: "document_back_path", file: back },
      ]
      if (proof instanceof File && proof.size > 0) {
        uploads.push({ field: "document_proof_path", file: proof })
      }

      const paths: {
        document_front_path?: string
        document_back_path?: string
        document_proof_path?: string
      } = {}

      for (const { field, file } of uploads) {
        const ext = guessExtension(file.type) ?? "bin"
        const path = `${user.id}/${verificationId}/${field.replace("document_", "").replace("_path", "")}.${ext}`
        const buf = await file.arrayBuffer()
        const { error: upErr } = await service.storage
          .from("identity-documents")
          .upload(path, buf, { contentType: file.type, upsert: true })
        if (upErr) {
          return { ok: false, errorCode: "generic", errorMessage: upErr.message }
        }
        paths[field] = path
      }

      const { error: updErr } = await supabase
        .from("identity_verifications")
        .update(paths)
        .eq("id", verificationId)
      if (updErr) return { ok: false, errorCode: "generic", errorMessage: updErr.message }

      return { ok: true, verificationId }
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
