"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { appendCaseActivity } from "@/features/cases/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const inputSchema = z.object({ documentId: z.string().uuid() })

export interface DeleteDocumentResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "not_found" | "not_owner" | "frozen_status" | "generic"
}

export async function deleteDocumentAction(input: unknown): Promise<DeleteDocumentResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, case_id, client_id, status, storage_path")
    .eq("id", parsed.data.documentId)
    .maybeSingle()
  if (!doc) return { ok: false, errorCode: "not_found" }
  if (doc.client_id !== user.id) return { ok: false, errorCode: "not_owner" }
  if (doc.status === "approved" || doc.status === "archived") {
    return { ok: false, errorCode: "frozen_status" }
  }

  return withCompliance(
    {
      action: "document.deleted",
      resourceType: "documents",
      userId: user.id,
      resourceId: doc.id,
    },
    async () => {
      const service = createServiceClient()
      const { error: storageErr } = await service.storage
        .from("case-documents")
        .remove([doc.storage_path])
      if (storageErr) {
        // Continuar: la fila DB es la fuente de verdad, el archivo huérfano se limpia luego
      }
      const { error } = await service
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", doc.id)
      if (error) return { ok: false, errorCode: "generic" }

      await appendCaseActivity({
        caseId: doc.case_id,
        actorId: user.id,
        actorType: "client",
        activityType: "document.deleted",
        description: "Documento eliminado por el cliente",
        metadata: { document_id: doc.id },
      })

      revalidatePath(`/[locale]/cases/${doc.case_id}/documents`, "page")
      return { ok: true }
    },
  )
}
