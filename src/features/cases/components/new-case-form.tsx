"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import { createCaseAction } from "../actions/create-case"

interface ServiceMeta {
  slug: string
  name: string
  beneficiaryLabel: string | null
  allowsMultipleBeneficiaries: boolean
}

export function NewCaseForm({ service }: { service: ServiceMeta }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(service.name)
  const [beneficiaryName, setBeneficiaryName] = useState("")
  const [relationship, setRelationship] = useState("")

  function onSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await createCaseAction({
        serviceSlug: service.slug,
        displayName,
        beneficiary: service.beneficiaryLabel
          ? {
              full_name: beneficiaryName || undefined,
              relationship: relationship || undefined,
            }
          : undefined,
      })
      if (!res.ok) {
        if (res.errorCode === "residency_required") {
          setError(
            "Necesitas verificar tu residencia Utah antes de iniciar un caso. Completa el onboarding.",
          )
        } else if (res.errorCode === "service_not_found") {
          setError("Servicio no encontrado.")
        } else {
          setError(res.errorMessage ?? "Error inesperado")
        }
        return
      }
      if (res.caseId) router.push(`/cases/${res.caseId}`)
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <div className="space-y-1">
        <Label htmlFor="displayName">Nombre del caso</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
        />
        <p className="text-xs text-muted-foreground">
          Personalízalo si manejarás varios casos del mismo servicio (ej. "Guardianship — sobrina
          María").
        </p>
      </div>

      {service.beneficiaryLabel && (
        <>
          <div className="space-y-1">
            <Label htmlFor="beneficiaryName">Nombre del/de la {service.beneficiaryLabel}</Label>
            <Input
              id="beneficiaryName"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="relationship">Relación contigo (opcional)</Label>
            <Input
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Sobrino, hijo, empresa..."
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "..." : "Iniciar caso"}
      </Button>
    </form>
  )
}
