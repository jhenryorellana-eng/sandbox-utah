/**
 * Money — value object inmutable.
 * Almacenamos siempre en centavos (`cents`) para evitar errores de coma flotante.
 */
export class Money {
  readonly cents: number
  readonly currency: "USD"

  constructor(cents: number, currency: "USD" = "USD") {
    if (!Number.isInteger(cents)) {
      throw new Error(`Money.cents must be an integer, got ${cents}`)
    }
    if (cents < 0) throw new Error(`Money.cents must be non-negative, got ${cents}`)
    this.cents = cents
    this.currency = currency
  }

  static fromCents(cents: number): Money {
    return new Money(cents)
  }

  static fromDollars(dollars: number): Money {
    return new Money(Math.round(dollars * 100))
  }

  toDollars(): number {
    return this.cents / 100
  }

  format(locale: "es" | "en" = "es"): string {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-US", {
      style: "currency",
      currency: this.currency,
    }).format(this.toDollars())
  }
}
