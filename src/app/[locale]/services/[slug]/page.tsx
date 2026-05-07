import { ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react"
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
    <section className="page-shell max-w-4xl flex-1">
      <p className="brand-kicker">{locale === "es" ? category.name_es : category.name_en}</p>
      <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-normal sm:text-5xl">
        {name}
      </h1>
      <p className="mt-4 max-w-3xl text-xl font-extrabold leading-snug text-foreground">
        {shortDesc}
      </p>
      {longDesc && <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{longDesc}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
              {t("whatIncludes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6">
              {includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="size-5 text-accent" aria-hidden />
              {t("whatDoesNotInclude")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6">
              {excludes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="glass-panel mt-8 flex flex-wrap items-center justify-between gap-5 rounded-lg p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black text-primary">{price}</span>
          {duration && (
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground">
              <Clock3 className="size-4" aria-hidden />
              {duration} {t("minutes")}
            </span>
          )}
        </div>
        <Button asChild>
          <Link href={`/cases/new?service=${service.slug}`} className="inline-flex">
            {t("startCase")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <p className="mt-6 border-l-2 border-accent/60 pl-3 text-xs font-semibold leading-6 text-muted-foreground">
        {t("disclaimerInline")}
      </p>
    </section>
  )
}
