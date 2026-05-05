import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"]

export async function fetchContractByCase(
  caseId: string,
  clientId: string,
): Promise<ContractRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("case_id", caseId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
