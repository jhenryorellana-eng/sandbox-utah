import { setRequestLocale } from "next-intl/server"
import { CatalogEditor } from "@/features/catalog/components/catalog-editor"
import { fetchAdminCatalog } from "@/features/catalog/repository"
import type { Locale } from "@/lib/i18n/routing"

export default async function AdminCatalogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const catalog = await fetchAdminCatalog()

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Catálogo de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Edita servicios, precios base y tiers (precio por número de beneficiarios). Cada cambio
          queda registrado en el audit log.
        </p>
      </header>
      <CatalogEditor catalog={catalog} />
    </section>
  )
}
