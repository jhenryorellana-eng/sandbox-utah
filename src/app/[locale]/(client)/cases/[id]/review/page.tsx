import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewSubmitForm } from "@/features/cases/components/review-submit-form"
import { fetchCaseById } from "@/features/cases/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { getWorkflow } from "@/server/workflows"

export default async function CaseReviewPage({
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
  const workflow = getWorkflow(caseRow.service.workflow_slug)
  if (!workflow) notFound()

  const formData = (caseRow.form_data ?? {}) as Record<string, unknown>

  return (
    <section className="page-shell max-w-3xl flex-1">
      <p className="brand-kicker">{caseRow.case_number}</p>
      <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal">
        Revisión: {caseRow.display_name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Verifica que todos los datos sean correctos antes de enviar a revisión QA.
      </p>

      <div className="mt-6 space-y-4">
        {workflow.steps.map((step) => (
          <Card key={step.id} className="lift-card">
            <CardHeader>
              <CardTitle className="text-base">
                {locale === "es" ? step.titleEs : step.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {step.fields.map((field) => {
                  const value = formData[field.id]
                  return (
                    <div key={field.id} className="space-y-0.5">
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                        {locale === "es" ? field.labelEs : field.labelEn}
                      </dt>
                      <dd className="font-medium">
                        {value === undefined || value === null || value === ""
                          ? "—"
                          : typeof value === "boolean"
                            ? value
                              ? "Sí"
                              : "No"
                            : String(value)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </CardContent>
          </Card>
        ))}

        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠ Borrador — No presentar hasta firmar el PDF final post-revisión.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link href={`/cases/${caseRow.id}/wizard`}>← Editar respuestas</Link>
          </Button>
          <ReviewSubmitForm caseId={caseRow.id} />
        </div>
      </div>
    </section>
  )
}
