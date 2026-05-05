"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { validatePersonalData } from "../state"

export interface UpdatePersonalInfoResult {
  ok: boolean
  errorCode?: "auth" | "validation" | "underage" | "invalid_dob" | "generic"
  errorMessage?: string
}

export async function updatePersonalInfoAction(
  formData: FormData,
): Promise<UpdatePersonalInfoResult> {
  const validation = validatePersonalData({
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
  })

  if (!validation.ok) return { ok: false, errorCode: validation.errorCode }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  return withCompliance(
    {
      action: "onboarding.personal_info_updated",
      resourceType: "profiles",
      resourceId: user.id,
      userId: user.id,
      piiAccessed: true,
    },
    async (): Promise<UpdatePersonalInfoResult> => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validation.data.fullName,
          date_of_birth: validation.data.dateOfBirth,
          phone: validation.data.phone ?? null,
        })
        .eq("id", user.id)

      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }
      return { ok: true }
    },
  )
}
