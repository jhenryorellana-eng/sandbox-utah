import "server-only"

import { fetchCaseMinors } from "@/features/cases/repository"
import { fetchCaseDocuments } from "@/features/documents/repository"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { PrefillBuilder, readExtractedField } from "../../_shared/prefill-helpers"
import type { DemoPetitionValues } from "./schema"

export interface PrefillContext {
  caseId: string
  clientId: string
}

export interface PrefillOutput {
  values: Partial<DemoPetitionValues>
  sources: Record<keyof DemoPetitionValues, { from: string; refId?: string } | null>
}

export async function prefillDemoPetition(context: PrefillContext): Promise<PrefillOutput> {
  const supabase = await createServerClient()
  const service = createServiceClient()

  const [{ data: profile }, minors, documents, { data: caseRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", context.clientId)
      .maybeSingle(),
    fetchCaseMinors(context.caseId),
    fetchCaseDocuments(context.caseId),
    service.from("cases").select("form_data").eq("id", context.caseId).maybeSingle(),
  ])

  const builder = new PrefillBuilder<DemoPetitionValues>()

  if (profile?.full_name) {
    builder.set("petitioner_full_name", profile.full_name, {
      field: "petitioner_full_name",
      from: "profile",
    })
  }
  if (profile?.email) {
    builder.set("petitioner_email", profile.email, { field: "petitioner_email", from: "profile" })
  }
  if (profile?.phone) {
    builder.set("petitioner_phone", profile.phone, { field: "petitioner_phone", from: "profile" })
  }

  // Address: del jsonb form_data si existe, sino del documento ID del tutor
  const formData = (caseRow?.form_data ?? null) as Record<string, unknown> | null
  if (formData?.address && typeof formData.address === "string") {
    builder.set("petitioner_address", formData.address, {
      field: "petitioner_address",
      from: "case",
    })
  } else {
    const guardianIdDoc = documents.find(
      (d) => d.minor_id === null && d.extraction_status === "extracted",
    )
    const address = readExtractedField<string>(guardianIdDoc ?? null, "address")
    if (address) {
      builder.set("petitioner_address", address, {
        field: "petitioner_address",
        from: "document",
        refId: guardianIdDoc?.id,
      })
    }
  }

  // Hijos desde case_minors + birth_certificate extraído por minor
  const sortedMinors = minors.slice().sort((a, b) => a.display_index - b.display_index)
  const childFields: Array<{
    name: keyof DemoPetitionValues
    dob: keyof DemoPetitionValues
    place?: keyof DemoPetitionValues
  }> = [
    { name: "child_1_full_name", dob: "child_1_dob", place: "child_1_birthplace" },
    { name: "child_2_full_name", dob: "child_2_dob", place: "child_2_birthplace" },
    { name: "child_3_full_name", dob: "child_3_dob", place: "child_3_birthplace" },
    { name: "child_4_full_name", dob: "child_4_dob" },
  ]

  const limit = Math.min(sortedMinors.length, childFields.length)
  for (let i = 0; i < limit; i++) {
    const minor = sortedMinors[i]
    const target = childFields[i]
    if (!minor || !target) continue
    builder.set(target.name, minor.full_name, {
      field: target.name as string,
      from: "minor",
      refId: minor.id,
    })
    if (minor.date_of_birth) {
      builder.set(target.dob, minor.date_of_birth, {
        field: target.dob as string,
        from: "minor",
        refId: minor.id,
      })
    }
    if (target.place) {
      const birthCertDoc = documents.find(
        (d) => d.minor_id === minor.id && d.extraction_status === "extracted",
      )
      const place = readExtractedField<string>(birthCertDoc ?? null, "place_of_birth")
      if (place) {
        builder.set(target.place, place, {
          field: target.place as string,
          from: "document",
          refId: birthCertDoc?.id,
        })
      }
    }
  }

  const result = builder.build()
  return {
    values: result.values,
    sources: result.sources as PrefillOutput["sources"],
  }
}
