"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { uploadDocumentAction } from "../actions/upload-document"

interface FileUploadButtonProps {
  caseId: string
  documentTypeId: string
  minorId?: string | null
  acceptedTypes: string[]
  label?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  onUploaded: () => void
}

export function FileUploadButton({
  caseId,
  documentTypeId,
  minorId,
  acceptedTypes,
  label = "Subir archivo",
  variant = "default",
  size = "sm",
  onUploaded,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onPick() {
    inputRef.current?.click()
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const fd = new FormData()
    fd.append("caseId", caseId)
    fd.append("documentTypeId", documentTypeId)
    if (minorId) fd.append("minorId", minorId)
    fd.append("file", file)

    startTransition(async () => {
      const result = await uploadDocumentAction(fd)
      if (!result.ok) {
        setError(messageFor(result.errorCode))
        return
      }
      // Reset input para permitir re-upload del mismo archivo
      if (inputRef.current) inputRef.current.value = ""
      onUploaded()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant={variant} size={size} onClick={onPick} disabled={pending}>
        {pending ? "Subiendo..." : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={onChange}
        className="hidden"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function messageFor(code: string | undefined): string {
  switch (code) {
    case "file_too_large":
      return "Archivo muy grande. El máximo es 20 MB."
    case "invalid_type":
      return "Tipo de archivo no permitido (usa PDF, JPG, PNG o WebP)."
    case "case_not_found":
      return "Caso no encontrado."
    case "doc_type_not_found":
      return "Tipo de documento no encontrado."
    case "minor_mismatch":
      return "Beneficiario inválido para este documento."
    case "auth":
      return "Sesión expirada. Vuelve a iniciar sesión."
    case "validation":
      return "Datos inválidos."
    default:
      return "Error al subir. Inténtalo de nuevo."
  }
}
