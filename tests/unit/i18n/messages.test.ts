import { describe, expect, it } from "vitest"
import enMessages from "../../../messages/en.json"
import esMessages from "../../../messages/es.json"

const REQUIRED_CONSENTS = [
  "is_utah_resident",
  "not_a_law_firm",
  "no_legal_advice",
  "no_immigration",
  "accuracy_responsibility",
  "ai_usage",
  "complaint_rights",
  "tos_privacy",
] as const

describe("i18n messages parity", () => {
  it("ES y EN tienen el mismo top-level shape", () => {
    expect(Object.keys(esMessages).sort()).toEqual(Object.keys(enMessages).sort())
  })

  it("los 8 consents existen en ES con texto y versión", () => {
    const items = esMessages.Consents.items as Record<string, { text: string; version: string }>
    for (const key of REQUIRED_CONSENTS) {
      const item = items[key]
      if (!item) throw new Error(`ES missing ${key}`)
      expect(item.text).toBeTruthy()
      expect(item.version).toMatch(/^v\d+\.\d+/)
    }
  })

  it("los 8 consents existen en EN con texto y versión", () => {
    const items = enMessages.Consents.items as Record<string, { text: string; version: string }>
    for (const key of REQUIRED_CONSENTS) {
      const item = items[key]
      if (!item) throw new Error(`EN missing ${key}`)
      expect(item.text).toBeTruthy()
      expect(item.version).toMatch(/^v\d+\.\d+/)
    }
  })

  it("complaintBanner contiene el URL oficial del Innovation Office", () => {
    expect(esMessages.Disclaimers.complaintBanner).toContain(
      "utahinnovationoffice.org/sandbox-customer-complaint",
    )
    expect(enMessages.Disclaimers.complaintBanner).toContain(
      "utahinnovationoffice.org/sandbox-customer-complaint",
    )
  })

  it("notALawFirm contiene la frase canónica", () => {
    expect(esMessages.Disclaimers.notALawFirm).toContain("no es un bufete de abogados")
    expect(enMessages.Disclaimers.notALawFirm.toLowerCase()).toContain("not a law firm")
  })
})
