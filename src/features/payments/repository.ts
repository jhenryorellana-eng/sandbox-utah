import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import type { Database } from "@/shared/types/database"

export type PaymentPlanRow = Database["public"]["Tables"]["payment_plans"]["Row"]
export type InstallmentRow = Database["public"]["Tables"]["installments"]["Row"]
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"]

export interface PlanWithInstallments extends PaymentPlanRow {
  installments: InstallmentRow[]
}

export async function fetchPlanForCase(
  caseId: string,
  clientId: string,
): Promise<PlanWithInstallments | null> {
  const supabase = await createServerClient()
  const { data: plan, error } = await supabase
    .from("payment_plans")
    .select("*, installments(*)")
    .eq("case_id", caseId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!plan) return null
  const typed = plan as unknown as PaymentPlanRow & { installments?: InstallmentRow[] }
  return {
    ...typed,
    installments: (typed.installments ?? []).sort(
      (a, b) => a.installment_number - b.installment_number,
    ),
  }
}

export async function fetchPaymentsForCase(
  caseId: string,
  clientId: string,
): Promise<PaymentRow[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("case_id", caseId)
    .eq("client_id", clientId)
    .order("reported_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchPendingPayments(): Promise<
  Array<PaymentRow & { client: { full_name: string | null; email: string } }>
> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("payments")
    .select("*, client:profiles!payments_client_id_fkey(full_name, email)")
    .eq("status", "reported")
    .order("reported_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Array<
    PaymentRow & { client: { full_name: string | null; email: string } }
  >
}
