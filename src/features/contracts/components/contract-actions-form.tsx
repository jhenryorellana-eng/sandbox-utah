"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/lib/i18n/navigation"
import {
  confirmStubSignatureAction,
  sendContractForSignatureAction,
} from "../actions/send-for-signature"

export function ContractActionsForm({
  caseId,
  signatureStatus,
}: {
  caseId: string
  signatureStatus: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [signingUrl, setSigningUrl] = useState<string | null>(null)

  function send() {
    setError(null)
    startTransition(async () => {
      const res = await sendContractForSignatureAction(caseId)
      if (!res.ok) {
        setError(res.errorMessage ?? "No se pudo enviar")
        return
      }
      if (res.signingUrl) setSigningUrl(res.signingUrl)
    })
  }

  function confirmStub() {
    setError(null)
    startTransition(async () => {
      const res = await confirmStubSignatureAction(caseId)
      if (!res.ok) {
        setError(res.errorMessage ?? "Error")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {signatureStatus === "draft" && (
        <Button type="button" onClick={send} disabled={pending}>
          {pending ? "..." : "Enviar contrato a firma"}
        </Button>
      )}
      {(signatureStatus === "sent" || signingUrl) && (
        <div className="space-y-2 rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <p>Contrato enviado. Revisa tu correo para firmarlo.</p>
          {signingUrl && (
            <a
              href={signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Abrir firma →
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={confirmStub}
            disabled={pending}
          >
            (Dev) Confirmar firma manualmente
          </Button>
        </div>
      )}
      {signatureStatus === "signed" && (
        <p className="text-sm text-emerald-700">Contrato firmado. Ya puedes proceder al pago.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
