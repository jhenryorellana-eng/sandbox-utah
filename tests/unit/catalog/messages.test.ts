import { describe, expect, it } from "vitest"
import enMessages from "../../../messages/en.json"
import esMessages from "../../../messages/es.json"

describe("catalog i18n", () => {
  it("ES tiene namespaces nuevos del Sprint 3-4", () => {
    expect(esMessages.Catalog).toBeDefined()
    expect(esMessages.Onboarding).toBeDefined()
    expect(esMessages.Identity).toBeDefined()
    expect(esMessages.Admin).toBeDefined()
  })

  it("EN tiene los mismos namespaces", () => {
    expect(enMessages.Catalog).toBeDefined()
    expect(enMessages.Onboarding).toBeDefined()
    expect(enMessages.Identity).toBeDefined()
    expect(enMessages.Admin).toBeDefined()
  })

  it("Catalog.categories tiene los 3 slugs", () => {
    expect(esMessages.Catalog.categories).toMatchObject({
      family: expect.any(String),
      housing: expect.any(String),
      business: expect.any(String),
    })
  })

  it("Onboarding.steps tiene los 5 pasos", () => {
    const keys = Object.keys(esMessages.Onboarding.steps).sort()
    expect(keys).toEqual(["consents", "language", "personal", "residency", "tutorial"])
  })

  it("Identity.statuses cubre los 6 estados de la state machine", () => {
    expect(Object.keys(esMessages.Identity.statuses).sort()).toEqual([
      "approved",
      "awaiting_user_review",
      "extracting",
      "pending_admin",
      "rejected",
      "submitted",
    ])
  })
})
