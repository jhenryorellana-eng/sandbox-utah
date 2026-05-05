"use server"

import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { extractDocumentForUser } from "@/server/integrations/gemini/legal-assistant"

const extractedSchema = z.object({
  full_name: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  address_street: z.string().nullable(),
  address_city: z.string().nullable(),
  address_state: z.string().nullable(),
  address_zip: z.string().nullable(),
  id_number_last4: z.string().length(4).nullable(),
  id_state: z.string().nullable(),
  expiration_date: z.string().nullable(),
  is_utah: z.boolean(),
})

export type ExtractedIdentity = z.infer<typeof extractedSchema>

const STUB_DATA: ExtractedIdentity = {
  full_name: "[Stub] Necesitas configurar GOOGLE_GEMINI_API_KEY",
  date_of_birth: null,
  address_street: null,
  address_city: null,
  address_state: "UT",
  address_zip: null,
  id_number_last4: null,
  id_state: "UT",
  expiration_date: null,
  is_utah: true,
}

export interface ExtractIdentityResult {
  ok: boolean
  data?: ExtractedIdentity
  errorCode?: "auth" | "not_found" | "no_image" | "extraction_failed"
  errorMessage?: string
  stub?: boolean
}

/**
 * Lee la imagen del documento ya subido a `identity-documents` y usa Gemini
 * multimodal para extraer datos estructurados. El cliente luego confirma.
 */
export async function extractIdentityAction(
  verificationId: string,
): Promise<ExtractIdentityResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: verification } = await supabase
    .from("identity_verifications")
    .select("user_id, document_front_path")
    .eq("id", verificationId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!verification?.document_front_path) {
    return { ok: false, errorCode: "no_image" }
  }

  return withCompliance(
    {
      action: "identity.extracted",
      resourceType: "identity_verifications",
      resourceId: verificationId,
      userId: user.id,
      piiAccessed: true,
    },
    async (): Promise<ExtractIdentityResult> => {
      const service = createServiceClient()
      const { data: blob, error: dlErr } = await service.storage
        .from("identity-documents")
        .download(verification.document_front_path ?? "")
      if (dlErr || !blob) {
        return { ok: false, errorCode: "extraction_failed", errorMessage: dlErr?.message }
      }
      const buffer = await blob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")

      const result = await extractDocumentForUser<ExtractedIdentity>(
        user.id,
        null,
        "identity_document_extract",
        {
          imageBase64: base64,
          mimeType: blob.type || "image/jpeg",
          schema: extractedSchema,
          schemaName: "identity_document_extract",
          schemaDescription:
            "Schema para extraer datos de driver license o state ID: full_name, date_of_birth (YYYY-MM-DD), address_*, id_number_last4 (solo últimos 4), id_state, expiration_date, is_utah (boolean).",
          stubFallback: STUB_DATA,
        },
      )

      if (!result.ok) {
        return {
          ok: false,
          errorCode: "extraction_failed",
          errorMessage: result.errorMessage ?? "Gemini error",
        }
      }

      // Persistir extracción y avanzar status
      await service
        .from("identity_verifications")
        .update({
          status: "awaiting_user_review",
          extracted_full_name: result.data?.full_name ?? null,
          extracted_date_of_birth: result.data?.date_of_birth ?? null,
          extracted_address_street: result.data?.address_street ?? null,
          extracted_address_city: result.data?.address_city ?? null,
          extracted_address_state: result.data?.address_state ?? null,
          extracted_address_zip: result.data?.address_zip ?? null,
          extracted_id_number_last4: result.data?.id_number_last4 ?? null,
          extracted_id_state: result.data?.id_state ?? null,
          extracted_expiration_date: result.data?.expiration_date ?? null,
        })
        .eq("id", verificationId)

      const out: ExtractIdentityResult = { ok: true }
      if (result.data) out.data = result.data
      if (result.stub !== undefined) out.stub = result.stub
      return out
    },
  )
}
