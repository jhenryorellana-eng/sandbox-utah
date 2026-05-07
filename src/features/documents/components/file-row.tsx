"use client"

import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteDocumentAction } from "../actions/delete-document"
import type { DocumentRow } from "../repository"

interface FileRowProps {
  doc: DocumentRow
  onDeleted: () => void
  readOnly?: boolean
}

export function FileRow({ doc, onDeleted, readOnly }: FileRowProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Auto-refresh mientras IA está procesando (max ~5 min de polling)
  useEffect(() => {
    if (doc.extraction_status !== "pending" && doc.extraction_status !== "extracting") return
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)
    return () => clearInterval(interval)
  }, [doc.extraction_status, router])

  function handleDelete() {
    if (!confirm(`¿Eliminar "${doc.filename}"?`)) return
    startTransition(async () => {
      const result = await deleteDocumentAction({ documentId: doc.id })
      if (result.ok) onDeleted()
    })
  }

  const sizeLabel = formatBytes(doc.size_bytes)
  const extractionLabel = labelForExtraction(doc.extraction_status)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-2.5 text-sm">
      <a
        href={`/api/documents/${doc.id}/signed-url`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
      >
        {doc.filename}
      </a>
      <span className="text-xs text-muted-foreground">{sizeLabel}</span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${toneForStatus(doc.status)}`}
      >
        {labelForStatus(doc.status)}
      </span>
      {extractionLabel ? (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${toneForExtraction(doc.extraction_status)}`}
        >
          {extractionLabel}
        </span>
      ) : null}
      {!readOnly && doc.status !== "approved" ? (
        <Button type="button" size="sm" variant="ghost" onClick={handleDelete} disabled={pending}>
          {pending ? "..." : "Eliminar"}
        </Button>
      ) : null}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function labelForStatus(status: string): string {
  const map: Record<string, string> = {
    uploaded: "Subido",
    approved: "Aprobado",
    rejected: "Rechazado",
    archived: "Archivado",
  }
  return map[status] ?? status
}

function toneForStatus(status: string): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-900"
    case "rejected":
      return "bg-rose-100 text-rose-900"
    case "archived":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-blue-100 text-blue-900"
  }
}

function labelForExtraction(status: string): string | null {
  const map: Record<string, string> = {
    pending: "IA pendiente",
    extracting: "IA leyendo...",
    extracted: "IA listo",
    extraction_failed: "IA falló",
    skipped: "",
  }
  return map[status] ?? null
}

function toneForExtraction(status: string): string {
  switch (status) {
    case "extracted":
      return "bg-emerald-100 text-emerald-900"
    case "extracting":
      return "bg-blue-100 text-blue-900 animate-pulse"
    case "pending":
      return "bg-amber-100 text-amber-900"
    case "extraction_failed":
      return "bg-rose-100 text-rose-900"
    default:
      return "bg-muted text-muted-foreground"
  }
}
