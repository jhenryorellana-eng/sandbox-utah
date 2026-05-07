import { ArrowUpRight, Clock3 } from "lucide-react"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { Money } from "@/shared/domain/money"
import type { ServiceRow } from "../repository"

interface ServiceCardProps {
  service: ServiceRow
  locale: Locale
  accent: string
}

export function ServiceCard({ service, locale, accent }: ServiceCardProps) {
  const name = locale === "es" ? service.name_es : service.name_en
  const desc = locale === "es" ? service.short_description_es : service.short_description_en
  const price = Money.fromCents(service.base_price_cents).format(locale)
  const duration = service.estimated_duration_minutes
    ? `${service.estimated_duration_minutes} min`
    : null

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group lift-card block h-full rounded-lg border border-white/70 bg-white/78 p-4 shadow-[0_18px_48px_oklch(0.2_0.047_255_/_9%)] outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <article className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden
            className="mt-1 h-10 w-1.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <ArrowUpRight
            className="size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>
        <h3 className="mt-5 text-xl font-black leading-tight tracking-normal text-foreground">
          {name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{desc}</p>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border/70 pt-4">
          <span className="text-lg font-black text-primary">{price}</span>
          {duration ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden />
              {duration}
            </span>
          ) : null}
        </div>
      </article>
    </Link>
  )
}
