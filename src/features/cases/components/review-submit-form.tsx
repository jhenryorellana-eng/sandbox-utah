"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/lib/i18n/navigation"
import { submitForReviewAction } from "../actions/save-form-data"

export function ReviewSubmitForm({ caseId }: { caseId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await submitForReviewAction(caseId)
      if (!res.ok) {
        setError(res.errorMessage ?? "No se pudo enviar a revisión")
        return
      }
      router.push(`/cases/${caseId}`)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={onSubmit} disabled={pending}>
        {pending ? "..." : "Enviar a revisión QA"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
