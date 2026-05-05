import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchServiceBySlug } from "@/features/catalog/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { Money } from "@/shared/domain/money"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const result = await fetchServiceBySlug(slug)
  if (!result) return {}
  const name = locale === "es" ? result.service.name_es : result.service.name_en
  return { title: name }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "Catalog" })

  const result = await fetchServiceBySlug(slug)
  if (!result) notFound()

  const { service, category } = result
  const name = locale === "es" ? service.name_es : service.name_en
  const longDesc = locale === "es" ? service.long_description_es : service.long_description_en
  const shortDesc = locale === "es" ? service.short_description_es : service.short_description_en
  const includes = (
    locale === "es" ? service.what_it_includes_es : service.what_it_includes_en
  ) as string[]
  const excludes = (
    locale === "es" ? service.what_it_does_not_include_es : service.what_it_does_not_include_en
  ) as string[]
  const price = Money.fromCents(service.base_price_cents).format(locale)
  const duration = service.estimated_duration_minutes

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {locale === "es" ? category.name_es : category.name_en}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{shortDesc}</p>
      {longDesc && <p className="mt-2 leading-relaxed">{longDesc}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("whatIncludes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("whatDoesNotInclude")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {excludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{price}</span>
          {duration && (
            <span className="text-sm text-muted-foreground">
              · {duration} {t("minutes")}
            </span>
          )}
        </div>
        <Button asChild>
          <Link href={`/cases/new?service=${service.slug}`} className="inline-flex">
            {t("startCase")}
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-xs italic text-muted-foreground">{t("disclaimerInline")}</p>
    </section>
  )
}
