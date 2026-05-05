"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { resolveComplaintAction } from "@/features/complaints/actions/admin-resolve"

export function ComplaintRowActions({ complaintId }: { complaintId: string }) {
  const [open, setOpen] = useState(false)
  const [resolution, setResolution] = useState("")
  const [escalate, setEscalate] = useState(false)
  const [reportInnovation, setReportInnovation] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (resolution.length < 5) {
      setError("Resolución muy corta.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await resolveComplaintAction({
        complaintId,
        resolution,
        newStatus: escalate ? "escalated" : "resolved",
        reportToInnovationOffice: reportInnovation,
      })
      if (!res.ok) setError(res.errorMessage ?? "Error")
      else setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Resolver / Escalar
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <textarea
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        rows={4}
        placeholder="Describe la resolución de la queja..."
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <Checkbox id="escalate" checked={escalate} onCheckedChange={() => setEscalate(!escalate)} />
        <Label htmlFor="escalate" className="cursor-pointer">
          Escalar (en lugar de resolver)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="reportInnovation"
          checked={reportInnovation}
          onCheckedChange={() => setReportInnovation(!reportInnovation)}
        />
        <Label htmlFor="reportInnovation" className="cursor-pointer">
          Marcar como reportado al Innovation Office
        </Label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
