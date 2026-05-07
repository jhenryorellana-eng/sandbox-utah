"use client"

import type { CaseMinorRow } from "@/features/cases/repository"
import type { DocumentRow, DocumentTypeRow } from "../repository"
import { DocumentCard } from "./document-card"

export interface DocumentsTabProps {
  caseId: string
  serviceSlug: string
  documentTypes: DocumentTypeRow[]
  documents: DocumentRow[]
  minors: CaseMinorRow[]
  locale: "es" | "en"
}

interface SectionGroup {
  key: string
  title_es: string
  title_en: string
  matcher: (slug: string) => boolean
}

const DEFAULT_SECTIONS: SectionGroup[] = [
  {
    key: "minor",
    title_es: "Documentos por menor",
    title_en: "Per-minor documents",
    matcher: (slug) => slug.includes(".minor.") || slug.endsWith(".minor"),
  },
  {
    key: "guardian",
    title_es: "Documentos del tutor",
    title_en: "Guardian documents",
    matcher: (slug) => slug.includes(".guardian.") || slug.endsWith(".guardian"),
  },
  {
    key: "witness",
    title_es: "Testigos",
    title_en: "Witnesses",
    matcher: (slug) => slug.includes(".witness.") || slug.endsWith(".witness"),
  },
  {
    key: "evidence",
    title_es: "Evidencias",
    title_en: "Evidence",
    matcher: (slug) => slug.endsWith(".evidence") || slug.includes(".evidence."),
  },
  {
    key: "other",
    title_es: "Otros documentos",
    title_en: "Other documents",
    matcher: () => true,
  },
]

function classifyType(slug: string): string {
  for (const section of DEFAULT_SECTIONS) {
    if (section.matcher(slug)) return section.key
  }
  return "other"
}

export function DocumentsTab({
  caseId,
  documentTypes,
  documents,
  minors,
  locale,
}: DocumentsTabProps) {
  const grouped = new Map<string, DocumentTypeRow[]>()
  for (const dt of documentTypes) {
    const key = classifyType(dt.slug)
    const arr = grouped.get(key) ?? []
    arr.push(dt)
    grouped.set(key, arr)
  }

  const docsByTypeAndMinor = new Map<string, DocumentRow[]>()
  for (const doc of documents) {
    const key = `${doc.document_type_id ?? "_"}:${doc.minor_id ?? "general"}`
    const arr = docsByTypeAndMinor.get(key) ?? []
    arr.push(doc)
    docsByTypeAndMinor.set(key, arr)
  }

  const renderSection = (sectionKey: string) => {
    const types = grouped.get(sectionKey)
    if (!types || types.length === 0) return null
    const meta = DEFAULT_SECTIONS.find((s) => s.key === sectionKey)
    if (!meta) return null

    if (sectionKey === "minor") {
      if (minors.length === 0) {
        return (
          <section key={sectionKey} className="space-y-2">
            <h3 className="text-base font-black">
              {locale === "es" ? meta.title_es : meta.title_en}
            </h3>
            <p className="text-sm text-muted-foreground">Este caso no tiene menores asociados.</p>
          </section>
        )
      }
      return (
        <section key={sectionKey} className="space-y-3">
          <h3 className="text-base font-black">
            {locale === "es" ? meta.title_es : meta.title_en}
          </h3>
          {minors.map((minor) => (
            <details
              key={minor.id}
              open
              className="rounded-lg border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-xl"
            >
              <summary className="cursor-pointer text-sm font-black">
                {minor.full_name}
                {minor.date_of_birth ? (
                  <span className="text-muted-foreground"> · {minor.date_of_birth}</span>
                ) : null}
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {types.map((dt) => {
                  const docs = docsByTypeAndMinor.get(`${dt.id}:${minor.id}`) ?? []
                  return (
                    <DocumentCard
                      key={`${dt.id}:${minor.id}`}
                      caseId={caseId}
                      documentType={dt}
                      minor={{ id: minor.id, full_name: minor.full_name }}
                      documents={docs}
                      locale={locale}
                    />
                  )
                })}
              </div>
            </details>
          ))}
        </section>
      )
    }

    return (
      <section key={sectionKey} className="space-y-3">
        <h3 className="text-base font-black">{locale === "es" ? meta.title_es : meta.title_en}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {types.map((dt) => {
            const docs = docsByTypeAndMinor.get(`${dt.id}:general`) ?? []
            return (
              <DocumentCard
                key={`${dt.id}:general`}
                caseId={caseId}
                documentType={dt}
                documents={docs}
                locale={locale}
              />
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      {DEFAULT_SECTIONS.map((s) => renderSection(s.key))}
      <p className="rounded-lg border border-border/70 bg-white/60 p-3 text-xs leading-5 text-muted-foreground backdrop-blur-xl">
        Los documentos quedan privados; sólo tú y nuestro equipo pueden verlos. Cada subida y
        eliminación queda registrada en el log de auditoría.
      </p>
    </div>
  )
}
