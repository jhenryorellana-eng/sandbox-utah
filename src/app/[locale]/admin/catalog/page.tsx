import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { fetchActiveCatalog } from "@/features/catalog/repository"
import type { Locale } from "@/lib/i18n/routing"

export default async function AdminCatalogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const catalog = await fetchActiveCatalog()
  return <Catalog catalog={catalog} locale={locale} />
}

function Catalog({
  catalog,
  locale,
}: {
  catalog: Awaited<ReturnType<typeof fetchActiveCatalog>>
  locale: Locale
}) {
  const t = useTranslations("Admin.catalog")
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>
      <Card>
        <CardContent className="space-y-3 py-6">
          {catalog.map((cat) => (
            <details key={cat.id} className="rounded-md border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {locale === "es" ? cat.name_es : cat.name_en} ({cat.services.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4 text-sm text-muted-foreground">
                {cat.services.map((s) => (
                  <li key={s.id}>· {locale === "es" ? s.name_es : s.name_en}</li>
                ))}
              </ul>
            </details>
          ))}
          <p className="pt-3 text-xs italic text-muted-foreground">{t("comingSoon")}</p>
        </CardContent>
      </Card>
    </section>
  )
}
