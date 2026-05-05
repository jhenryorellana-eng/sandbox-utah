import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchCaseById } from "@/features/cases/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

const STATUS_LABEL_ES: Record<string, string> = {
  created: "Creado",
  contract_pending: "Contrato pendiente de firma",
  contract_signed: "Contrato firmado — esperando pago",
  payment_pending: "Pago pendiente",
  in_progress: "En progreso",
  review_pending: "En revisión QA",
  needs_correction: "Necesita correcciones",
  approved: "Aprobado — listo para finalizar",
  finalized: "Finalizado",
  archived: "Archivado",
  cancelled: "Cancelado",
}

export default async function CaseDetailPage({
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

  const serviceName = locale === "es" ? caseRow.service.name_es : caseRow.service.name_en

  const canEnterWizard =
    caseRow.intake_status === "in_progress" ||
    caseRow.intake_status === "needs_correction" ||
    caseRow.intake_status === "payment_pending"

  const canEnterFiling =
    caseRow.intake_status === "approved" ||
    caseRow.intake_status === "finalized" ||
    caseRow.intake_status === "review_pending" ||
    caseRow.intake_status === "in_progress"

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {caseRow.case_number}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{caseRow.display_name}</h1>
      <p className="text-muted-foreground">{serviceName}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {STATUS_LABEL_ES[caseRow.intake_status] ?? caseRow.intake_status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Precio acordado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {caseRow.agreed_price_cents
                ? Money.fromCents(caseRow.agreed_price_cents).format(locale)
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canEnterWizard && (
          <Button asChild>
            <Link href={`/cases/${caseRow.id}/wizard`}>Continuar wizard</Link>
          </Button>
        )}
        {caseRow.intake_status === "contract_pending" && (
          <Button asChild>
            <Link href={`/cases/${caseRow.id}/contract`}>Revisar y firmar contrato</Link>
          </Button>
        )}
        {caseRow.intake_status === "review_pending" && (
          <Card className="w-full bg-secondary/30">
            <CardContent className="py-3 text-sm">
              Tu caso está en revisión por nuestro equipo. Te avisaremos cuando avance.
            </CardContent>
          </Card>
        )}
        {caseRow.intake_status === "approved" && (
          <Button asChild>
            <Link href={`/cases/${caseRow.id}/review`}>Revisar y firmar PDF final</Link>
          </Button>
        )}
        {caseRow.intake_status === "finalized" && (
          <Button asChild variant="outline">
            <Link href={`/cases/${caseRow.id}/finalize`}>Ver instrucciones de filing</Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href={`/cases/${caseRow.id}/payments`}>Mis pagos</Link>
        </Button>
        {canEnterFiling && (
          <Button asChild variant="secondary">
            <Link href={`/cases/${caseRow.id}/filing`}>
              {locale === "en" ? "Filing by district" : "Radicación por distrito"}
            </Link>
          </Button>
        )}
      </div>
    </section>
  )
}
