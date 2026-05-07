import { describe, expect, it } from "vitest"
import { Money } from "@/shared/domain/money"

describe("service tier pricing", () => {
  it("convierte centavos a dólares con format en es-US", () => {
    expect(Money.fromCents(35000).format("es")).toMatch(/350\.00/)
    expect(Money.fromCents(50000).format("es")).toMatch(/500\.00/)
    expect(Money.fromCents(65000).format("es")).toMatch(/650\.00/)
  })

  it("calcula descuento por # beneficiarios respetando centavos", () => {
    const tier1 = Money.fromCents(35000) // 1 hijo
    const tier2 = Money.fromCents(50000) // 2 hijos
    const tier3 = Money.fromCents(65000) // 3 hijos

    expect(tier2.cents - tier1.cents).toBe(15000) // 2do hijo agrega 150
    expect(tier3.cents - tier2.cents).toBe(15000) // 3er hijo agrega 150
    expect(tier1.cents * 2 - tier2.cents).toBe(20000) // ahorras 200 vs. 2x plan individual
    expect(tier1.cents * 3 - tier3.cents).toBe(40000) // ahorras 400 vs. 3x plan individual
  })

  it("Money.fromDollars redondea correctamente para evitar floats", () => {
    expect(Money.fromDollars(350).cents).toBe(35000)
    expect(Money.fromDollars(350.001).cents).toBe(35000)
    expect(Money.fromDollars(350.999).cents).toBe(35100)
  })

  it("rechaza centavos no enteros (estricto)", () => {
    expect(() => new Money(350.5)).toThrow()
    expect(() => new Money(-100)).toThrow()
  })
})
