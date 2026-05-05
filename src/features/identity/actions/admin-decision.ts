"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { ComplianceError, withCompliance } from "@/server/compliance"

export interface AdminDecisionResult {
  ok: boolean
  errorCode?: "auth" | "not_admin" | "validation" | "generic"
  errorMessage?: string
}

async function requireAdmin(): Promise<{ userId: string } | { error: AdminDecisionResult }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: { ok: false, errorCode: "auth" } }
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (error || !data) return { error: { ok: false, errorCode: "not_admin" } }
  return { userId: user.id }
}

export async function approveIdentityAction(verificationId: string): Promise<AdminDecisionResult> {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  return withCompliance(
    {
      action: "identity.approved",
      resourceType: "identity_verifications",
      resourceId: verificationId,
      userId: auth.userId,
      piiAccessed: true,
    },
    async (): Promise<AdminDecisionResult> => {
      const supabase = await createServerClient()
      const { data: verification } = await supabase
        .from("identity_verifications")
        .select("user_id")
        .eq("id", verificationId)
        .single()
      if (!verification) throw new ComplianceError("verification not found", "not_found")

      const now = new Date().toISOString()
      const { error: vErr } = await supabase
        .from("identity_verifications")
        .update({
          status: "approved",
          admin_reviewed_by: auth.userId,
          admin_reviewed_at: now,
        })
        .eq("id", verificationId)
      if (vErr) return { ok: false, errorCode: "generic", errorMessage: vErr.message }

      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          utah_residency_verified: true,
          utah_residency_verified_at: now,
          utah_residency_method: "admin_verified",
        })
        .eq("id", verification.user_id)
      if (pErr) return { ok: false, errorCode: "generic", errorMessage: pErr.message }

      revalidatePath("/admin/identity-verifications")
      return { ok: true }
    },
  )
}

export async function rejectIdentityAction(
  verificationId: string,
  reason: string,
): Promise<AdminDecisionResult> {
  if (!reason.trim()) return { ok: false, errorCode: "validation" }
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  return withCompliance(
    {
      action: "identity.rejected",
      resourceType: "identity_verifications",
      resourceId: verificationId,
      userId: auth.userId,
      metadata: { reasonLength: reason.length },
    },
    async (): Promise<AdminDecisionResult> => {
      const supabase = await createServerClient()
      const { error } = await supabase
        .from("identity_verifications")
        .update({
          status: "rejected",
          admin_reviewed_by: auth.userId,
          admin_reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq("id", verificationId)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      revalidatePath("/admin/identity-verifications")
      return { ok: true }
    },
  )
}
