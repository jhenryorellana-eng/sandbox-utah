import type { Route } from "next"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { WizardRuntime } from "@/features/cases/components/wizard-runtime"
import { fetchCaseById } from "@/features/cases/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { getWorkflow } from "@/server/workflows"

export default async function CaseWizardPage({
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

  if (!["in_progress", "needs_correction", "payment_pending"].includes(caseRow.intake_status)) {
    redirect(`/${locale}/cases/${id}` as unknown as Route)
  }

  const workflow = getWorkflow(caseRow.service.workflow_slug)
  if (!workflow) notFound()

  const initialStep = caseRow.current_step ?? workflow.steps[0]?.id ?? "step1"

  return (
    <section className="page-shell max-w-3xl flex-1">
      <p className="brand-kicker">{caseRow.case_number}</p>
      <h1 className="my-5 text-3xl font-black leading-tight tracking-normal">
        {caseRow.display_name}
      </h1>

      <WizardRuntime
        caseId={caseRow.id}
        steps={workflow.steps.map((s) => ({
          id: s.id,
          titleEs: s.titleEs,
          titleEn: s.titleEn,
          descriptionEs: s.descriptionEs,
          descriptionEn: s.descriptionEn,
          fields: s.fields,
        }))}
        initialData={(caseRow.form_data ?? {}) as Record<string, unknown>}
        initialStepId={initialStep}
        completedSteps={caseRow.completed_steps ?? []}
        locale={locale}
      />
    </section>
  )
}
