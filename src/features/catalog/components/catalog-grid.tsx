import type { Locale } from "@/lib/i18n/routing"
import type { CategoryWithServices } from "../repository"
import { ServiceCard } from "./service-card"

export function CatalogGrid({
  catalog,
  locale,
}: {
  catalog: CategoryWithServices[]
  locale: Locale
}) {
  return (
    <div className="space-y-12">
      {catalog.map((category) => {
        const name = locale === "es" ? category.name_es : category.name_en
        const description = locale === "es" ? category.description_es : category.description_en
        return (
          <section key={category.id} aria-labelledby={`cat-${category.slug}`}>
            <header className="mb-4 flex items-baseline gap-3">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color_hex }}
              />
              <h2 id={`cat-${category.slug}`} className="text-2xl font-semibold tracking-tight">
                {name}
              </h2>
            </header>
            {description && (
              <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.services.map((s) => (
                <ServiceCard key={s.id} service={s} locale={locale} accent={category.color_hex} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
