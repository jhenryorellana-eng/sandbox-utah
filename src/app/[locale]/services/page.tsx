import { Compass, ShieldAlert } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CatalogGrid } from "@/features/catalog/components/catalog-grid"
import { fetchActiveCatalog } from "@/features/catalog/repository"
import type { Locale } from "@/lib/i18n/routing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Catalog" })
  return { title: t("pageTitle"), description: t("pageDescription") }
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const catalog = await fetchActiveCatalog()
  const t = await getTranslations({ locale, namespace: "Catalog" })

  return (
    <section className="page-shell flex-1">
      <header className="mb-10 max-w-4xl animate-in-up">
        <p className="brand-kicker">
          <Compass className="size-3.5" aria-hidden />
          Utah services
        </p>
        <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-normal sm:text-5xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          {t("pageDescription")}
        </p>
        <p className="mt-4 inline-flex max-w-3xl items-start gap-2 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-bold text-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          {t("immigrationNotice")}
        </p>
      </header>

      {catalog.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <CatalogGrid catalog={catalog} locale={locale} />
      )}
    </section>
  )
}
