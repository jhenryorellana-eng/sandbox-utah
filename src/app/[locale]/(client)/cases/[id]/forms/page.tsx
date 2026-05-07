import { ArrowRight, FileText } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CaseShell } from "@/features/cases/components/case-shell"
import { fetchCaseById } from "@/features/cases/repository"
import { fetchFormBundle } from "@/features/forms/actions/fetch-bundle"
import { FormRunner } from "@/features/forms/components/form-runner"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { listFormsForCase } from "@/server/legal/utah-courts/forms/registry"

export default async function CaseFormsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ form?: string }>
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

  const forms = listFormsForCase(caseRow.service.slug, caseRow.filing_district_id)
  const { form: formSlug } = await searchParams

  if (formSlug) {
    const bundle = await fetchFormBundle(caseRow.id, formSlug)
    if (!bundle.ok) {
      return (
        <CaseShell caseRow={caseRow} locale={locale} currentTab="forms">
          <Card>
            <CardHeader>
              <CardTitle>Formulario no disponible</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No pudimos cargar el formulario solicitado.
              </p>
              <Link
                href={`/cases/${caseRow.id}/forms` as never}
                className="text-sm font-black text-primary hover:underline"
              >
                Volver a la lista
              </Link>
            </CardContent>
          </Card>
        </CaseShell>
      )
    }

    return (
      <CaseShell caseRow={caseRow} locale={locale} currentTab="forms">
        <div className="mb-3">
          <Link
            href={`/cases/${caseRow.id}/forms` as never}
            className="text-sm font-black text-primary hover:underline"
          >
            {locale === "es" ? "Volver a formularios" : "Back to forms"}
          </Link>
        </div>
        <FormRunner
          caseId={caseRow.id}
          formSlug={bundle.formSlug ?? formSlug}
          formName={(locale === "es" ? bundle.name_es : bundle.name_en) ?? formSlug}
          groups={bundle.groups ?? []}
          initialValues={bundle.values ?? {}}
          sources={bundle.sources ?? {}}
          status={bundle.status ?? "draft"}
          locale={locale}
        />
      </CaseShell>
    )
  }

  return (
    <CaseShell caseRow={caseRow} locale={locale} currentTab="forms">
      <div className="space-y-4">
        <p className="rounded-lg border border-border/70 bg-white/70 p-4 text-sm leading-6 text-muted-foreground backdrop-blur-xl">
          Estos son los formularios oficiales aplicables a tu caso. Los campos se autocompletaran
          con datos de tus documentos subidos y de tu perfil.
        </p>
        {forms.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No hay formularios registrados para este servicio todavia. Cuando carguemos los
              formularios oficiales del distrito, apareceran aqui.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form) => (
              <Link
                key={form.slug}
                href={`/cases/${caseRow.id}/forms?form=${form.slug}` as never}
                className="group lift-card block rounded-lg border border-white/70 bg-white/78 p-4 shadow-[0_16px_42px_oklch(0.2_0.047_255_/_8%)] backdrop-blur-xl"
              >
                <FileText className="mb-4 size-6 text-primary" aria-hidden />
                <h3 className="text-base font-black">
                  {locale === "es" ? form.name_es : form.name_en}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "es" ? "Version" : "Version"} {form.version}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-primary">
                  {locale === "es" ? "Abrir formulario" : "Open form"}
                  <ArrowRight
                    className="size-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CaseShell>
  )
}
