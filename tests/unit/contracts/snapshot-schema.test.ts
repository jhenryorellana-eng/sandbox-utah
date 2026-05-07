import { describe, expect, it } from "vitest"
import { buildTermsSnapshotV2, parseTermsSnapshot } from "@/features/contracts/snapshot-schema"

describe("terms_snapshot schema", () => {
  it("parsea snapshot v1 legacy (sin version)", () => {
    const v1 = {
      serviceSlug: "uncontested-divorce",
      priceCents: 29900,
      refundPolicyDays: 7,
      generatedAt: "2026-04-15T10:00:00Z",
    }
    const result = parseTermsSnapshot(v1)
    expect(result.version).toBe(2)
    expect(result.rawVersion).toBe(1)
    expect(result.serviceSlug).toBe("uncontested-divorce")
    expect(result.priceCents).toBe(29900)
    expect(result.tier).toBeNull()
    expect(result.minors).toEqual([])
  })

  it("parsea snapshot v2 con tier y minors", () => {
    const v2 = {
      version: 2 as const,
      serviceSlug: "child-custody",
      tier: {
        id: "11111111-1111-4111-8111-111111111111",
        beneficiariesCount: 2,
        label_es: "Custodia 2 hijos",
        label_en: "Custody 2 children",
        priceCents: 50000,
      },
      priceCents: 50000,
      refundPolicyDays: 7,
      minors: [
        { displayIndex: 1, fullName: "Juan Pérez", dateOfBirth: "2010-05-12" },
        { displayIndex: 2, fullName: "María Pérez", dateOfBirth: "2012-08-15" },
      ],
      generatedAt: "2026-05-07T10:00:00Z",
    }
    const result = parseTermsSnapshot(v2)
    expect(result.rawVersion).toBe(2)
    expect(result.tier?.beneficiariesCount).toBe(2)
    expect(result.minors).toHaveLength(2)
    expect(result.minors[0]?.fullName).toBe("Juan Pérez")
  })

  it("buildTermsSnapshotV2 incluye generatedAt y omite minors si vacío", () => {
    const built = buildTermsSnapshotV2({
      serviceSlug: "uncontested-divorce",
      priceCents: 29900,
      refundPolicyDays: 7,
    })
    expect(built.version).toBe(2)
    expect(built.minors).toBeUndefined()
    expect(built.tier).toBeNull()
    expect(built.generatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it("buildTermsSnapshotV2 con tier y minors", () => {
    const built = buildTermsSnapshotV2({
      serviceSlug: "child-custody",
      priceCents: 50000,
      refundPolicyDays: 7,
      tier: {
        id: "11111111-1111-4111-8111-111111111111",
        beneficiariesCount: 2,
        label_es: "Custodia 2 hijos",
        label_en: "Custody 2 children",
        priceCents: 50000,
      },
      minors: [{ displayIndex: 1, fullName: "Juan" }],
    })
    expect(built.tier?.id).toBe("11111111-1111-4111-8111-111111111111")
    expect(built.minors).toHaveLength(1)
  })

  it("rechaza snapshot inválido (campos faltantes)", () => {
    expect(() => parseTermsSnapshot({})).toThrow()
    expect(() => parseTermsSnapshot({ version: 2 })).toThrow()
    expect(() =>
      parseTermsSnapshot({
        version: 2,
        serviceSlug: "x",
        priceCents: -1,
        refundPolicyDays: 7,
        generatedAt: "2026",
      }),
    ).toThrow()
  })
})
