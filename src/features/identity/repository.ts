import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type IdentityVerificationRow = Database["public"]["Tables"]["identity_verifications"]["Row"]

export interface PendingVerification extends IdentityVerificationRow {
  profile: { email: string; full_name: string | null }
}

export async function fetchPendingVerifications(): Promise<PendingVerification[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("*, profile:profiles!identity_verifications_user_id_fkey(email, full_name)")
    .in("status", ["submitted", "pending_admin"])
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PendingVerification[]
}

export async function fetchUserActiveVerification(
  userId: string,
): Promise<IdentityVerificationRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Genera URL firmada (15 min) para que el admin vea el documento.
 * Solo se usa server-side; nunca se expone al cliente sin verificar admin role.
 */
export async function signedDocumentUrl(path: string): Promise<string | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.storage
    .from("identity-documents")
    .createSignedUrl(path, 60 * 15)
  if (error || !data) return null
  return data.signedUrl
}
