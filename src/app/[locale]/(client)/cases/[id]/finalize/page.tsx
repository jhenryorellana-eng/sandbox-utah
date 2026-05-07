import type { Route } from "next"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchCaseById } from "@/features/cases/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function CaseFinalizePage({
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

  if (caseRow.intake_status !== "finalized" && caseRow.intake_status !== "approved") {
    redirect(`/${locale}/cases/${id}` as unknown as Route)
  }

  return (
    <section className="page-shell max-w-3xl flex-1">
      <p className="brand-kicker">{caseRow.case_number}</p>
      <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">
        Caso finalizado: {caseRow.display_name}
      </h1>

      <div className="mt-6 space-y-4">
        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="text-base">Próximos pasos: presenta tu PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Descarga el PDF firmado desde el dashboard.</li>
              <li>Acude al District Court de tu condado o usa el e-filing del portal de Utah.</li>
              <li>
                Lleva $325 USD para el filing fee (o solicita Motion to Waive Fees si calificas).
              </li>
              <li>Guarda el comprobante de presentación que te entreguen.</li>
            </ol>
            <p className="rounded-md bg-secondary/30 p-3 text-xs text-muted-foreground">
              Recursos oficiales:{" "}
              <a
                href="https://www.utcourts.gov/en/self-help/services/forms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                utcourts.gov self-help forms
              </a>{" "}
              ·{" "}
              <a
                href="https://www.utcourts.gov/en/about/courts/find/locations.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Encuentra tu corte
              </a>
            </p>
          </CardContent>
        </Card>

        <Card className="lift-card">
          <CardHeader>
            <CardTitle className="text-base">¿Necesitas asesoría legal?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              No damos asesoría legal. Si tienes dudas sobre tu caso, consulta con un abogado
              licenciado en Utah o usa la línea de Utah Legal Help.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
