import { describe, expect, it } from "vitest"
import { validateVenue } from "@/server/legal/utah-courts/venue-validator"

describe("validateVenue — eviction-defense", () => {
  it("emite warning cuando filing county != propiedad", () => {
    const warnings = validateVenue({
      serviceSlug: "eviction-defense",
      filingCountyFips: "49035", // Salt Lake
      contextHints: { propertyCountyFips: "49049" }, // Utah
    })
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0]?.type).toBe("eviction_property_vs_filing_county")
    expect(warnings[0]?.statute).toBe("78B-3a-202")
  })

  it("no emite warning cuando coinciden", () => {
    const warnings = validateVenue({
      serviceSlug: "eviction-defense",
      filingCountyFips: "49035",
      contextHints: { propertyCountyFips: "49035" },
    })
    expect(warnings).toHaveLength(0)
  })

  it("no rompe sin hints", () => {
    expect(() =>
      validateVenue({
        serviceSlug: "eviction-defense",
        filingCountyFips: "49035",
      }),
    ).not.toThrow()
  })
})

describe("validateVenue — child-custody", () => {
  it("emite warning cuando UCCJEA child fuera de Utah", () => {
    const warnings = validateVenue({
      serviceSlug: "child-custody",
      filingCountyFips: "49049",
      contextHints: { childResidesInUtah: false },
    })
    expect(warnings.some((w) => w.type === "child_uccjea_outside_utah")).toBe(true)
  })
})

describe("validateVenue — uncontested-divorce / name-change", () => {
  it("emite warning si petitioner reside en otro condado", () => {
    const warningsDivorce = validateVenue({
      serviceSlug: "uncontested-divorce",
      filingCountyFips: "49035",
      contextHints: { petitionerResidesCountyFips: "49049" },
    })
    expect(warningsDivorce.some((w) => w.type === "divorce_must_be_residence")).toBe(true)

    const warningsName = validateVenue({
      serviceSlug: "name-change",
      filingCountyFips: "49035",
      contextHints: { petitionerResidesCountyFips: "49011" },
    })
    expect(warningsName.some((w) => w.type === "namechange_must_be_residence")).toBe(true)
  })
})

describe("validateVenue — county inválido", () => {
  it("rechaza FIPS no en lista", () => {
    const warnings = validateVenue({
      serviceSlug: "small-claims",
      filingCountyFips: "06037", // LA County (no Utah)
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.type).toBe("smallclaims_no_link_to_county")
  })
})
