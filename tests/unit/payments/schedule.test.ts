import { describe, expect, it } from "vitest"
import { buildSchedule } from "@/features/payments/schedule"

describe("buildSchedule", () => {
  it("one_time genera 1 cuota con el total exacto", () => {
    const out = buildSchedule({
      totalCents: 29900,
      paymentType: "one_time",
      numInstallments: 1,
      downPaymentCents: 0,
      firstDueDate: new Date("2026-06-01"),
      cadence: "monthly",
    })
    expect(out).toHaveLength(1)
    expect(out[0]?.amountCents).toBe(29900)
    expect(out[0]?.dueDate).toBe("2026-06-01")
    expect(out[0]?.isDownPayment).toBe(false)
  })

  it("installments sin down payment: 3 cuotas iguales", () => {
    const out = buildSchedule({
      totalCents: 30000,
      paymentType: "installments",
      numInstallments: 3,
      downPaymentCents: 0,
      firstDueDate: new Date("2026-06-01"),
      cadence: "monthly",
    })
    expect(out).toHaveLength(3)
    expect(out.map((i) => i.amountCents)).toEqual([10000, 10000, 10000])
    expect(out.map((i) => i.dueDate)).toEqual(["2026-06-01", "2026-07-01", "2026-08-01"])
  })

  it("installments con down payment crea cuota 0", () => {
    const out = buildSchedule({
      totalCents: 90000,
      paymentType: "installments",
      numInstallments: 3,
      downPaymentCents: 30000,
      firstDueDate: new Date("2026-06-01"),
      cadence: "monthly",
    })
    expect(out).toHaveLength(4)
    expect(out[0]?.installmentNumber).toBe(0)
    expect(out[0]?.isDownPayment).toBe(true)
    expect(out[0]?.amountCents).toBe(30000)
    expect(out.slice(1).map((i) => i.amountCents)).toEqual([20000, 20000, 20000])
  })

  it("la última cuota absorbe el residuo de centavos", () => {
    const out = buildSchedule({
      totalCents: 10000,
      paymentType: "installments",
      numInstallments: 3,
      downPaymentCents: 0,
      firstDueDate: new Date("2026-06-01"),
      cadence: "monthly",
    })
    expect(out.map((i) => i.amountCents)).toEqual([3333, 3333, 3334])
    expect(out.reduce((acc, i) => acc + i.amountCents, 0)).toBe(10000)
  })

  it("cadence biweekly suma 14 días por cuota", () => {
    const out = buildSchedule({
      totalCents: 20000,
      paymentType: "installments",
      numInstallments: 2,
      downPaymentCents: 0,
      firstDueDate: new Date("2026-06-01"),
      cadence: "biweekly",
    })
    expect(out[0]?.dueDate).toBe("2026-06-01")
    expect(out[1]?.dueDate).toBe("2026-06-15")
  })

  it("rechaza totalCents negativo o 0", () => {
    expect(() =>
      buildSchedule({
        totalCents: 0,
        paymentType: "one_time",
        numInstallments: 1,
        downPaymentCents: 0,
        firstDueDate: new Date(),
        cadence: "monthly",
      }),
    ).toThrow()
  })

  it("rechaza downPayment > total", () => {
    expect(() =>
      buildSchedule({
        totalCents: 100,
        paymentType: "installments",
        numInstallments: 2,
        downPaymentCents: 200,
        firstDueDate: new Date(),
        cadence: "monthly",
      }),
    ).toThrow()
  })

  it("residue=0 cuando total es múltiplo exacto", () => {
    const out = buildSchedule({
      totalCents: 60000,
      paymentType: "installments",
      numInstallments: 3,
      downPaymentCents: 0,
      firstDueDate: new Date("2026-06-01"),
      cadence: "monthly",
    })
    expect(out.map((i) => i.amountCents)).toEqual([20000, 20000, 20000])
  })
})
