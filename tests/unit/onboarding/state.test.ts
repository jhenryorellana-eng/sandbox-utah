import { describe, expect, it } from "vitest"
import {
  nextStep,
  ONBOARDING_STEPS,
  prevStep,
  validatePersonalData,
} from "@/features/onboarding/state"

describe("onboarding state", () => {
  it("ONBOARDING_STEPS son los 5 esperados en orden", () => {
    expect(ONBOARDING_STEPS).toEqual(["personal", "residency", "consents", "tutorial", "language"])
  })

  it("nextStep avanza linealmente", () => {
    expect(nextStep("personal")).toBe("residency")
    expect(nextStep("residency")).toBe("consents")
    expect(nextStep("consents")).toBe("tutorial")
    expect(nextStep("tutorial")).toBe("language")
    expect(nextStep("language")).toBeNull()
  })

  it("prevStep retrocede linealmente", () => {
    expect(prevStep("personal")).toBeNull()
    expect(prevStep("residency")).toBe("personal")
    expect(prevStep("language")).toBe("tutorial")
  })
})

describe("validatePersonalData", () => {
  function dobYearsAgo(years: number) {
    const d = new Date()
    d.setFullYear(d.getFullYear() - years)
    return d.toISOString().slice(0, 10)
  }

  it("acepta adulto >= 18 con datos válidos", () => {
    const r = validatePersonalData({
      fullName: "Juan Pérez",
      dateOfBirth: dobYearsAgo(30),
      phone: "555-1234",
    })
    expect(r.ok).toBe(true)
  })

  it("rechaza menor de 18", () => {
    const r = validatePersonalData({
      fullName: "Juan Pérez",
      dateOfBirth: dobYearsAgo(15),
    })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.errorCode).toBe("underage")
  })

  it("rechaza fullName muy corto", () => {
    const r = validatePersonalData({
      fullName: "J",
      dateOfBirth: dobYearsAgo(30),
    })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.errorCode).toBe("validation")
  })

  it("rechaza DOB con formato inválido", () => {
    const r = validatePersonalData({
      fullName: "Juan Pérez",
      dateOfBirth: "30-12-2000",
    })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.errorCode).toBe("validation")
  })

  it("phone es opcional", () => {
    const r = validatePersonalData({
      fullName: "Ana Lopez",
      dateOfBirth: dobYearsAgo(25),
    })
    expect(r.ok).toBe(true)
  })
})
