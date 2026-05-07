"use client"

import { CheckCircle2 } from "lucide-react"
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
      <p className="rounded-lg border border-dashed border-border bg-white/70 p-4 text-sm text-muted-foreground">
        Este servicio aún no tiene planes activos. Vuelve más tarde o contacta soporte.
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
                "lift-card relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left shadow-sm backdrop-blur-xl " +
                (selected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-white/70 bg-white/74 hover:border-primary/30 hover:bg-white/90")
              }
            >
              {selected ? (
                <CheckCircle2 className="absolute top-3 right-3 size-5 text-primary" aria-hidden />
              ) : null}
              <span className="pr-7 text-base font-black">{label}</span>
              <span className="text-2xl font-black text-primary">
                {Money.fromCents(tier.price_cents).format(locale)}
              </span>
              {description ? (
                <span className="text-xs leading-5 text-muted-foreground">{description}</span>
              ) : null}
            </button>
          )
        })}
    </div>
  )
}
