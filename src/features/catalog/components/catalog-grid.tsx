import type { Locale } from "@/lib/i18n/routing"
import type { CategoryWithServices } from "../repository"
import { ServiceCard } from "./service-card"

const CATEGORY_ACCENT: Record<string, string> = {
  family: "var(--brand-blue)",
  housing: "var(--brand-red)",
  business: "var(--brand-blue)",
}

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
        const accent = CATEGORY_ACCENT[category.slug] ?? category.color_hex
        return (
          <section key={category.id} aria-labelledby={`cat-${category.slug}`}>
            <header className="mb-5 flex flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2 w-12 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                    {category.services.length} {locale === "es" ? "servicios" : "services"}
                  </p>
                </div>
                <h2
                  id={`cat-${category.slug}`}
                  className="text-2xl font-black tracking-normal sm:text-3xl"
                >
                  {name}
                </h2>
              </div>
            </header>
            {description && (
              <p className="mb-5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.services.map((s) => (
                <ServiceCard key={s.id} service={s} locale={locale} accent={accent} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
