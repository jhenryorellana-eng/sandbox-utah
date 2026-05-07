import { FileSignature } from "lucide-react"
import type { Route } from "next"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchCaseById } from "@/features/cases/repository"
import { ContractActionsForm } from "@/features/contracts/components/contract-actions-form"
import { fetchContractByCase } from "@/features/contracts/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

export default async function CaseContractPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: rawLocale, id } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const caseRow = await fetchCaseById(id, user.id)
  if (!caseRow) notFound()
  const contract = await fetchContractByCase(id, user.id)
  if (!contract) notFound()

  if (caseRow.intake_status !== "contract_pending" && contract.signature_status !== "signed") {
    redirect(`/${locale}/cases/${id}` as unknown as Route)
  }

  const terms = contract.terms_snapshot as {
    serviceSlug: string
    priceCents: number
    refundPolicyDays: number
    generatedAt: string
  }

  return (
    <section className="page-shell max-w-3xl flex-1">
      <p className="brand-kicker">
        <FileSignature className="size-3.5" aria-hidden />
        Contrato {contract.contract_number}
      </p>
      <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-normal">
        {caseRow.display_name}
      </h1>

      <div className="mt-6 space-y-4">
        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="text-base">Términos del servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Servicio</dt>
                <dd className="font-medium">{terms.serviceSlug}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Precio acordado</dt>
                <dd className="font-medium">{Money.fromCents(terms.priceCents).format(locale)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Política de reembolso</dt>
                <dd className="font-medium">
                  {terms.refundPolicyDays} días desde la firma si no se generó el PDF final
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Estado de firma</dt>
                <dd className="font-medium">{contract.signature_status}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="text-base">Disclaimer obligatorio</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Esto NO es un bufete de abogados. Algunas personas que administran esta compañía no
              son abogados. La plataforma opera bajo el Utah Legal Regulatory Sandbox Phase 2 y te
              ayuda a llenar formularios con la información que tú proporcionas. Tú decides qué
              presentar y cuándo.
            </p>
          </CardContent>
        </Card>

        <ContractActionsForm caseId={id} signatureStatus={contract.signature_status} />
      </div>
    </section>
  )
}
