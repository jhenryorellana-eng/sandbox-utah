import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Link href={`/services/${service.slug}`} className="group block focus:outline-none">
      <Card className="h-full transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
        <CardHeader className="space-y-2">
          <span
            aria-hidden
            className="inline-block h-1 w-10 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-foreground">{price}</span>
          {duration && <span className="text-muted-foreground">{duration}</span>}
        </CardContent>
      </Card>
    </Link>
  )
}
