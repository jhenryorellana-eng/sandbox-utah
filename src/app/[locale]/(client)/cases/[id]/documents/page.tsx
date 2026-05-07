import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { CaseShell } from "@/features/cases/components/case-shell"
import { fetchCaseById, fetchCaseMinors } from "@/features/cases/repository"
import { DocumentsTab } from "@/features/documents/components/documents-tab"
import { fetchCaseDocuments, fetchDocumentTypesForService } from "@/features/documents/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function CaseDocumentsPage({
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

  const [documentTypes, documents, minors] = await Promise.all([
    fetchDocumentTypesForService(caseRow.service.slug),
    fetchCaseDocuments(caseRow.id),
    fetchCaseMinors(caseRow.id),
  ])

  return (
    <CaseShell caseRow={caseRow} locale={locale} currentTab="documents">
      <DocumentsTab
        caseId={caseRow.id}
        serviceSlug={caseRow.service.slug}
        documentTypes={documentTypes}
        documents={documents}
        minors={minors}
        locale={locale}
      />
    </CaseShell>
  )
}
