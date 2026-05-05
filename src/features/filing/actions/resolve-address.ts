"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance/wrap-with-compliance"
import { resolveCountyForCase } from "@/server/legal/utah-courts"
import { FilingError } from "../errors"

/**
 * Server action invocable desde la pestaña Radicación. Retorna el resultado
 * actual de la resolución (no la persiste — la confirmación es manual).
 */

export interface ResolveAddressResponse {
  status: "resolved" | "needs_manual"
  countyFips?: string
  countyName?: string
  districtId?: number
  source?: string
  reason?: string
  suggestedCity?: string | null
}

export async function resolveAddressForCase(caseId: string): Promise<ResolveAddressResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new FilingError("unauthorized")

  return withCompliance(
    {
      userId: user.id,
      action: "filing.address.resolve",
      resourceType: "case",
      resourceId: caseId,
      piiAccessed: true,
    },
    async () => {
      const result = await resolveCountyForCase(caseId)
      if (result.status === "resolved") {
        return {
          status: "resolved",
          countyFips: result.countyFips,
          countyName: result.countyName,
          districtId: result.districtId,
          source: result.source,
        }
      }
      const out: ResolveAddressResponse = {
        status: "needs_manual",
        reason: result.reason,
      }
      if (result.reason === "city_not_recognized" && result.suggestedCity) {
        out.suggestedCity = result.suggestedCity
      }
      return out
    },
  )
}
