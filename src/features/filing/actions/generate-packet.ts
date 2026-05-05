"use server"

import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance/wrap-with-compliance"
import { type BuildPacketResult, buildPacket } from "@/server/legal/utah-courts"
import { FilingError } from "../errors"

export interface GeneratePacketResponse {
  ok: boolean
  packet?: BuildPacketResult
  error?: {
    code: string
    detail?: string | null
  }
}

export async function generateFilingPacket(
  caseId: string,
  countyFipsOverride?: string,
): Promise<GeneratePacketResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new FilingError("unauthorized")

  return withCompliance(
    {
      userId: user.id,
      action: "filing.packet.generate",
      resourceType: "case",
      resourceId: caseId,
      piiAccessed: false,
      metadata: countyFipsOverride ? { county_fips_override: countyFipsOverride } : undefined,
    },
    async () => {
      const result = await buildPacket({
        caseId,
        countyFipsOverride: countyFipsOverride ?? null,
      })
      if (!result.ok) {
        const err = result.error
        const detail =
          "reason" in err
            ? err.reason
            : "current" in err
              ? err.current
              : "message" in err
                ? err.message
                : null
        return { ok: false, error: { code: err.kind, detail } }
      }
      return { ok: true, packet: result.packet }
    },
  )
}
