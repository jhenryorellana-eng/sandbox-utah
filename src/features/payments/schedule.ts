/**
 * Calculadora de cronograma de pagos. Pure function, fácil de testear.
 *
 * Reglas:
 *  - down_payment_cents = 0 → no se crea installment 0; cuotas numeradas 1..N.
 *  - down_payment_cents > 0 → installment 0 (enganche) + N cuotas.
 *  - Total = down_payment + suma(cuotas). La división se reparte de forma que
 *    la última cuota absorbe el residuo de centavos para que la suma cuadre.
 */
export interface InstallmentBlueprint {
  installmentNumber: number
  amountCents: number
  dueDate: string
  isDownPayment: boolean
}

export interface BuildScheduleInput {
  totalCents: number
  paymentType: "one_time" | "installments"
  numInstallments: number
  downPaymentCents: number
  firstDueDate: Date
  cadence: "monthly" | "biweekly" | "weekly"
}

export function buildSchedule(input: BuildScheduleInput): InstallmentBlueprint[] {
  if (input.totalCents <= 0) throw new Error("totalCents must be positive")
  if (input.downPaymentCents < 0) throw new Error("downPaymentCents must be non-negative")
  if (input.downPaymentCents > input.totalCents) {
    throw new Error("downPaymentCents cannot exceed totalCents")
  }

  if (input.paymentType === "one_time") {
    return [
      {
        installmentNumber: 1,
        amountCents: input.totalCents,
        dueDate: toIsoDate(input.firstDueDate),
        isDownPayment: false,
      },
    ]
  }

  if (input.numInstallments < 1) throw new Error("numInstallments must be >= 1")

  const result: InstallmentBlueprint[] = []
  if (input.downPaymentCents > 0) {
    result.push({
      installmentNumber: 0,
      amountCents: input.downPaymentCents,
      dueDate: toIsoDate(input.firstDueDate),
      isDownPayment: true,
    })
  }

  const remaining = input.totalCents - input.downPaymentCents
  const baseAmount = Math.floor(remaining / input.numInstallments)
  const residue = remaining - baseAmount * input.numInstallments

  for (let i = 1; i <= input.numInstallments; i++) {
    const isLast = i === input.numInstallments
    const amount = isLast ? baseAmount + residue : baseAmount
    const due = addCadence(
      input.firstDueDate,
      input.downPaymentCents > 0 ? i : i - 1,
      input.cadence,
    )
    result.push({
      installmentNumber: i,
      amountCents: amount,
      dueDate: toIsoDate(due),
      isDownPayment: false,
    })
  }

  return result
}

function addCadence(base: Date, units: number, cadence: "monthly" | "biweekly" | "weekly"): Date {
  const d = new Date(base.getTime())
  if (cadence === "monthly") {
    d.setUTCMonth(d.getUTCMonth() + units)
  } else if (cadence === "biweekly") {
    d.setUTCDate(d.getUTCDate() + 14 * units)
  } else {
    d.setUTCDate(d.getUTCDate() + 7 * units)
  }
  return d
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
