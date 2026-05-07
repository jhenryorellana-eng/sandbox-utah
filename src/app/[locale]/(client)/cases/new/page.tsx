import { FilePlus2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewCaseForm } from "@/features/cases/components/new-case-form"
import { fetchServiceBySlug } from "@/features/catalog/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function NewCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ service?: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { service: serviceSlug } = await searchParams
  if (!serviceSlug) notFound()

  const result = await fetchServiceBySlug(serviceSlug)
  if (!result) notFound()

  const name = locale === "es" ? result.service.name_es : result.service.name_en
  const beneficiaryLabel =
    locale === "es" ? result.service.beneficiary_label_es : result.service.beneficiary_label_en

  return (
    <section className="page-shell max-w-3xl flex-1">
      <Card className="animate-in-up">
        <CardHeader className="space-y-4">
          <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <FilePlus2 className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-2xl">Iniciar: {name}</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Yo elijo iniciar este servicio. Confirmo que la decisión es mía.
          </p>
        </CardHeader>
        <CardContent>
          <NewCaseForm
            service={{
              slug: result.service.slug,
              name,
              beneficiaryLabel,
              allowsMultipleBeneficiaries: result.service.allows_multiple_beneficiaries,
              basePriceCents: result.service.base_price_cents,
            }}
            tiers={result.tiers.map((t) => ({
              id: t.id,
              beneficiaries_count: t.beneficiaries_count,
              price_cents: t.price_cents,
              label_es: t.label_es,
              label_en: t.label_en,
              description_es: t.description_es,
              description_en: t.description_en,
            }))}
            locale={locale}
          />
        </CardContent>
      </Card>
    </section>
  )
}
