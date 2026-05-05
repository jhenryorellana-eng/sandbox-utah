"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance/wrap-with-compliance"
import { persistFilingLocation } from "@/server/legal/utah-courts"
import { FilingError } from "../errors"
import { type ConfirmCountyInput, confirmCountySchema } from "../schemas/address-schema"

export interface ConfirmCountyResponse {
  ok: boolean
  districtId?: number
  error?: string
}

export async function confirmCountyForCase(
  input: ConfirmCountyInput,
): Promise<ConfirmCountyResponse> {
  const parsed = confirmCountySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new FilingError("unauthorized")

  return withCompliance(
    {
      userId: user.id,
      action: "filing.address.confirm_county",
      resourceType: "case",
      resourceId: parsed.data.caseId,
      piiAccessed: true,
      metadata: { county_fips: parsed.data.countyFips },
    },
    async () => {
      const result = await persistFilingLocation(parsed.data.caseId, parsed.data.countyFips)
      if ("error" in result) {
        return { ok: false, error: result.error }
      }
      return { ok: true, districtId: result.districtId }
    },
  )
}
