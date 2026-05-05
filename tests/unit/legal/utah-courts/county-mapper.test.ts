import { describe, expect, it } from "vitest"
import {
  getCountyByFips,
  getCountyByName,
  getDistrictForCounty,
  groupCountiesByDistrict,
  lookupCountyByCity,
  normalizeCounty,
  UTAH_COUNTIES,
} from "@/server/legal/utah-courts/county-mapper"

describe("UTAH_COUNTIES catálogo", () => {
  it("incluye exactamente 29 condados", () => {
    expect(UTAH_COUNTIES).toHaveLength(29)
  })

  it("todos los FIPS empiezan con 49 y tienen 5 dígitos", () => {
    for (const c of UTAH_COUNTIES) {
      expect(c.fipsCode).toMatch(/^49\d{3}$/)
    }
  })

  it("los distritos están entre 1 y 8", () => {
    for (const c of UTAH_COUNTIES) {
      expect(c.district).toBeGreaterThanOrEqual(1)
      expect(c.district).toBeLessThanOrEqual(8)
    }
  })

  it("cubre todos los 8 distritos al menos una vez", () => {
    const districts = new Set(UTAH_COUNTIES.map((c) => c.district))
    expect(districts.size).toBe(8)
  })

  it("no tiene FIPS duplicados", () => {
    const fips = new Set(UTAH_COUNTIES.map((c) => c.fipsCode))
    expect(fips.size).toBe(29)
  })
})

describe("mappings críticos por distrito", () => {
  const cases: ReadonlyArray<{ fips: string; name: string; expected: number }> = [
    { fips: "49035", name: "Salt Lake", expected: 3 },
    { fips: "49049", name: "Utah", expected: 4 },
    { fips: "49011", name: "Davis", expected: 2 },
    { fips: "49053", name: "Washington", expected: 5 },
    { fips: "49005", name: "Cache", expected: 1 },
    { fips: "49041", name: "Sevier", expected: 6 },
    { fips: "49007", name: "Carbon", expected: 7 },
    { fips: "49013", name: "Duchesne", expected: 8 },
  ]

  it.each(cases)("$name (FIPS $fips) → distrito $expected", ({ fips, name, expected }) => {
    expect(getCountyByFips(fips)?.district).toBe(expected)
    expect(getDistrictForCounty(fips)).toBe(expected)
    expect(getCountyByName(name)?.fipsCode).toBe(fips)
  })
})

describe("normalizeCounty", () => {
  it("quita 'County', acentos y casing", () => {
    expect(normalizeCounty("Salt Lake County")).toBe("salt lake")
    expect(normalizeCounty("salt-lake")).toBe("saltlake")
    expect(normalizeCounty("  Davis  ")).toBe("davis")
  })
})

describe("lookupCountyByCity", () => {
  it("resuelve ciudades grandes a su condado", () => {
    expect(lookupCountyByCity("Salt Lake City")?.fipsCode).toBe("49035")
    expect(lookupCountyByCity("Provo")?.fipsCode).toBe("49049")
    expect(lookupCountyByCity("st. george")?.fipsCode).toBe("49053")
    expect(lookupCountyByCity("OGDEN")?.fipsCode).toBe("49057")
  })

  it("devuelve null para ciudades fuera de la heurística", () => {
    expect(lookupCountyByCity("Atlantis")).toBeNull()
    expect(lookupCountyByCity("")).toBeNull()
    expect(lookupCountyByCity(null)).toBeNull()
  })
})

describe("groupCountiesByDistrict", () => {
  it("retorna 8 buckets con la suma total = 29", () => {
    const grouped = groupCountiesByDistrict()
    let total = 0
    for (
      let i = 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      i <= 8;
      i = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    ) {
      total += grouped[i].length
    }
    expect(total).toBe(29)
  })

  it("distrito 6 tiene 6 condados (Garfield, Kane, Piute, Sanpete, Sevier, Wayne)", () => {
    const grouped = groupCountiesByDistrict()
    expect(grouped[6].map((c) => c.name).sort()).toEqual([
      "Garfield",
      "Kane",
      "Piute",
      "Sanpete",
      "Sevier",
      "Wayne",
    ])
  })
})
