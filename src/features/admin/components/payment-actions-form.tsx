"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { rejectPaymentAction, verifyPaymentAction } from "@/features/payments/actions/admin-verify"

export function PaymentActionsForm({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  function approve() {
    setError(null)
    startTransition(async () => {
      const res = await verifyPaymentAction(paymentId)
      if (!res.ok) setError(res.errorMessage ?? "Error")
    })
  }

  function reject() {
    if (!reason.trim()) {
      setError("Escribe una razón.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await rejectPaymentAction(paymentId, reason)
      if (!res.ok) setError(res.errorMessage ?? "Error")
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {!showReject && (
        <div className="flex gap-2">
          <Button type="button" onClick={approve} disabled={pending}>
            Verificar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowReject(true)}
            disabled={pending}
          >
            Rechazar
          </Button>
        </div>
      )}
      {showReject && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Razón del rechazo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button type="button" variant="destructive" onClick={reject} disabled={pending}>
              Rechazar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowReject(false)
                setReason("")
                setError(null)
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
