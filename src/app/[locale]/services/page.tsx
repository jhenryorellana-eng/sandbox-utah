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
    <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-12">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("pageTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("pageDescription")}</p>
        <p className="mt-2 text-xs italic text-muted-foreground">{t("immigrationNotice")}</p>
      </header>

      {catalog.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <CatalogGrid catalog={catalog} locale={locale} />
      )}
    </section>
  )
}
