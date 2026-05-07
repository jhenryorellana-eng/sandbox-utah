import "server-only"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
export type DocumentTypeRow = Database["public"]["Tables"]["document_types"]["Row"]

export async function fetchDocumentTypesForService(
  serviceSlug: string,
): Promise<DocumentTypeRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("document_types")
    .select("*")
    .contains("applicable_services", [serviceSlug])
    .order("slug", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchCaseDocuments(caseId: string): Promise<DocumentRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCaseDocumentById(
  documentId: string,
  caseId: string,
): Promise<DocumentRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("case_id", caseId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createSignedUrlForDocument(
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string | null> {
  const service = createServiceClient()
  const { data, error } = await service.storage
    .from("case-documents")
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}
