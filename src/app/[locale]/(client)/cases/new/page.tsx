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
    <section className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar: {name}</CardTitle>
          <p className="text-sm text-muted-foreground">
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
            }}
          />
        </CardContent>
      </Card>
    </section>
  )
}
