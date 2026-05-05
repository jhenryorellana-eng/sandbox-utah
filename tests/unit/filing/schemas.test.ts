import { describe, expect, it } from "vitest"
import { confirmCountySchema } from "@/features/filing/schemas/address-schema"
import { printPacketSchema, printScopeSchema } from "@/features/filing/schemas/packet-schema"

const A_UUID = "00000000-0000-4000-a000-000000000000"

describe("confirmCountySchema", () => {
  it("acepta FIPS válido", () => {
    const r = confirmCountySchema.safeParse({ caseId: A_UUID, countyFips: "49035" })
    expect(r.success).toBe(true)
  })
  it("rechaza FIPS no Utah", () => {
    expect(confirmCountySchema.safeParse({ caseId: A_UUID, countyFips: "06037" }).success).toBe(
      false,
    )
  })
  it("rechaza caseId no uuid", () => {
    expect(confirmCountySchema.safeParse({ caseId: "abc", countyFips: "49035" }).success).toBe(
      false,
    )
  })
})

describe("printPacketSchema", () => {
  it("acepta full_packet sin formCode", () => {
    const r = printPacketSchema.safeParse({ caseId: A_UUID, scope: "full_packet" })
    expect(r.success).toBe(true)
  })

  it("acepta single_form con formCode", () => {
    const r = printPacketSchema.safeParse({
      caseId: A_UUID,
      scope: "single_form",
      formCode: "1100EV",
    })
    expect(r.success).toBe(true)
  })

  it("rechaza single_form sin formCode", () => {
    const r = printPacketSchema.safeParse({ caseId: A_UUID, scope: "single_form" })
    expect(r.success).toBe(false)
  })

  it("rechaza scope inválido", () => {
    const r = printPacketSchema.safeParse({ caseId: A_UUID, scope: "everything" })
    expect(r.success).toBe(false)
  })

  it("printScopeSchema acepta los 5 scopes oficiales", () => {
    for (const scope of ["full_packet", "intake_only", "case_only", "single_form", "cover_sheet"]) {
      expect(printScopeSchema.safeParse(scope).success).toBe(true)
    }
  })
})
