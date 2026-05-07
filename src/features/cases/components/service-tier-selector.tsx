"use client"

import { Money } from "@/shared/domain/money"

export interface SelectableTier {
  id: string
  beneficiaries_count: number
  price_cents: number
  label_es: string
  label_en: string
  description_es: string | null
  description_en: string | null
}

interface ServiceTierSelectorProps {
  tiers: SelectableTier[]
  selectedTierId: string | null
  onSelect: (tierId: string) => void
  locale: "es" | "en"
}

export function ServiceTierSelector({
  tiers,
  selectedTierId,
  onSelect,
  locale,
}: ServiceTierSelectorProps) {
  if (tiers.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Este servicio aún no tiene planes activos. Vuelve más tarde o contacta soporte.
      </p>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {tiers
        .slice()
        .sort((a, b) => a.beneficiaries_count - b.beneficiaries_count)
        .map((tier) => {
          const selected = tier.id === selectedTierId
          const label = locale === "es" ? tier.label_es : tier.label_en
          const description = locale === "es" ? tier.description_es : tier.description_en
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelect(tier.id)}
              aria-pressed={selected}
              className={
                "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors " +
                (selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/40")
              }
            >
              <span className="text-base font-semibold">{label}</span>
              <span className="text-xl font-bold text-primary">
                {Money.fromCents(tier.price_cents).format(locale)}
              </span>
              {description ? (
                <span className="text-xs text-muted-foreground">{description}</span>
              ) : null}
            </button>
          )
        })}
    </div>
  )
}
