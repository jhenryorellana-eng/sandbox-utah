import { ArrowRight, UsersRound } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CaseShell } from "@/features/cases/components/case-shell"
import { fetchCaseById, fetchCaseMinors } from "@/features/cases/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

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

  const minors = caseRow.beneficiary_count ? await fetchCaseMinors(caseRow.id) : []

  const canEnterWizard =
    caseRow.intake_status === "in_progress" ||
    caseRow.intake_status === "needs_correction" ||
    caseRow.intake_status === "payment_pending"

  return (
    <CaseShell caseRow={caseRow} locale={locale} currentTab="overview">
      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="text-base">Proximo paso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canEnterWizard ? (
              <Button asChild>
                <Link href={`/cases/${caseRow.id}/wizard`}>
                  Continuar wizard
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
            {caseRow.intake_status === "contract_pending" ? (
              <Button asChild>
                <Link href={`/cases/${caseRow.id}/contract`}>
                  Revisar y firmar contrato
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
            {caseRow.intake_status === "approved" ? (
              <Button asChild>
                <Link href={`/cases/${caseRow.id}/review`}>
                  Revisar PDF final
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
            {caseRow.intake_status === "finalized" ? (
              <Button asChild variant="outline">
                <Link href={`/cases/${caseRow.id}/finalize`}>Instrucciones de filing</Link>
              </Button>
            ) : null}
            {caseRow.intake_status === "review_pending" ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Tu caso esta siendo revisado por nuestro equipo. Te notificaremos por correo cuando
                tengamos novedades.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {minors.length > 0 ? (
          <Card className="lift-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersRound className="size-5 text-primary" aria-hidden />
                Beneficiarios del caso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {minors.map((m) => (
                  <li key={m.id} className="rounded-lg bg-secondary/60 px-3 py-2">
                    <span className="font-black">{m.full_name}</span>
                    {m.date_of_birth ? (
                      <span className="text-muted-foreground"> / {m.date_of_birth}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </CaseShell>
  )
}
