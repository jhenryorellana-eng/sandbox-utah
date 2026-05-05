import { describe, expect, it } from "vitest"
import { Money } from "@/shared/domain/money"

describe("Money", () => {
  it("constructor exige enteros", () => {
    expect(() => new Money(99.5)).toThrow()
  })

  it("rechaza negativos", () => {
    expect(() => new Money(-1)).toThrow()
  })

  it("fromCents preserva valor", () => {
    expect(Money.fromCents(2999).cents).toBe(2999)
  })

  it("fromDollars convierte y redondea", () => {
    expect(Money.fromDollars(29.99).cents).toBe(2999)
    expect(Money.fromDollars(0.1 + 0.2).cents).toBe(30)
  })

  it("toDollars expone número", () => {
    expect(Money.fromCents(12345).toDollars()).toBeCloseTo(123.45, 2)
  })

  it("format genera string en USD localizado", () => {
    const m = Money.fromCents(2999)
    expect(m.format("es")).toContain("29")
    expect(m.format("en")).toContain("$29.99")
  })
})
