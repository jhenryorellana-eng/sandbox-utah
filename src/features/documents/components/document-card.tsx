"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import type { DocumentSlotKind } from "@/shared/types/database"
import type { DocumentRow, DocumentTypeRow } from "../repository"
import { FileRow } from "./file-row"
import { FileUploadButton } from "./file-upload-button"

interface DocumentCardProps {
  caseId: string
  documentType: DocumentTypeRow
  minor?: { id: string; full_name: string } | null
  documents: DocumentRow[]
  locale: "es" | "en"
}

export function DocumentCard({
  caseId,
  documentType,
  minor,
  documents,
  locale,
}: DocumentCardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function refresh() {
    startTransition(() => router.refresh())
  }

  const slotKind = (documentType.slot_kind ?? "single") as DocumentSlotKind
  const accepted = documentType.accepts_file_types?.length
    ? documentType.accepts_file_types
    : ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  const name = locale === "es" ? documentType.name_es : documentType.name_en
  const description = locale === "es" ? documentType.description_es : documentType.description_en

  const titleSuffix = minor ? ` — ${minor.full_name}` : ""

  if (slotKind === "single") {
    const current = documents[0]
    return (
      <div className="lift-card rounded-lg border border-white/70 bg-white/78 p-4 shadow-sm backdrop-blur-xl">
        <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-black">
              {name}
              {titleSuffix}
              {documentType.is_required_default ? (
                <span className="ml-1 text-destructive" title="Requerido">
                  *
                </span>
              ) : null}
            </h4>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {!current ? (
            <FileUploadButton
              caseId={caseId}
              documentTypeId={documentType.id}
              minorId={minor?.id ?? null}
              acceptedTypes={accepted}
              onUploaded={refresh}
            />
          ) : null}
        </header>
        {current ? (
          <div className="space-y-2">
            <FileRow doc={current} onDeleted={refresh} />
            <div className="flex justify-end">
              <FileUploadButton
                caseId={caseId}
                documentTypeId={documentType.id}
                minorId={minor?.id ?? null}
                acceptedTypes={accepted}
                label="Reemplazar"
                variant="outline"
                onUploaded={refresh}
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  // multiple_named o dual_es_en (este último simplificado a múltiple por ahora)
  return (
    <div className="lift-card rounded-lg border border-white/70 bg-white/78 p-4 shadow-sm backdrop-blur-xl">
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-black">
            {name}
            {titleSuffix}
            {documentType.is_required_default ? (
              <span className="ml-1 text-destructive" title="Requerido">
                *
              </span>
            ) : null}
          </h4>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <FileUploadButton
          caseId={caseId}
          documentTypeId={documentType.id}
          minorId={minor?.id ?? null}
          acceptedTypes={accepted}
          label="+ Agregar"
          variant="outline"
          onUploaded={refresh}
        />
      </header>
      {documents.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">
          Sin archivos todavía. Puedes subir uno o más.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <FileRow key={doc.id} doc={doc} onDeleted={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
