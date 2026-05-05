"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  approveIdentityAction,
  rejectIdentityAction,
} from "@/features/identity/actions/admin-decision"

export function IdentityActionsForm({ verificationId }: { verificationId: string }) {
  const t = useTranslations("Admin.identity")
  const [pending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  function approve() {
    setError(null)
    startTransition(async () => {
      const res = await approveIdentityAction(verificationId)
      if (!res.ok) setError(res.errorMessage ?? "Error")
    })
  }

  function reject() {
    if (!reason.trim()) {
      setError(t("rejectReasonRequired"))
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await rejectIdentityAction(verificationId, reason)
      if (!res.ok) setError(res.errorMessage ?? "Error")
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {!showReject && (
        <div className="flex gap-2">
          <Button type="button" onClick={approve} disabled={pending}>
            {t("approve")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowReject(true)}
            disabled={pending}
          >
            {t("reject")}
          </Button>
        </div>
      )}

      {showReject && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder={t("rejectReason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button type="button" variant="destructive" onClick={reject} disabled={pending}>
              {t("reject")}
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
              Cancel
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
