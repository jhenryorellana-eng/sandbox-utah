import { BookOpen } from "lucide-react"
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
      <div className="glass-panel rounded-lg p-5 sm:p-6">
        <p className="brand-kicker">
          <BookOpen className="size-3.5" aria-hidden />
          Servicios
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">
          Catalogo de servicios
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Edita servicios, precios base y tiers por numero de beneficiarios. Cada cambio queda
          registrado en el audit log.
        </p>
      </div>
      <CatalogEditor catalog={catalog} />
    </section>
  )
}
