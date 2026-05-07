"use client"

import { ArrowRight, BadgeCheck } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import { Money } from "@/shared/domain/money"
import { createCaseAction } from "../actions/create-case"
import { ensureMinorsLength, type MinorInput, MinorListEditor } from "./minor-list-editor"
import { type SelectableTier, ServiceTierSelector } from "./service-tier-selector"

interface ServiceMeta {
  slug: string
  name: string
  beneficiaryLabel: string | null
  allowsMultipleBeneficiaries: boolean
  basePriceCents: number
}

interface NewCaseFormProps {
  service: ServiceMeta
  tiers: SelectableTier[]
  locale: "es" | "en"
}

export function NewCaseForm({ service, tiers, locale }: NewCaseFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(service.name)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    service.allowsMultipleBeneficiaries
      ? (tiers.slice().sort((a, b) => a.beneficiaries_count - b.beneficiaries_count)[0]?.id ?? null)
      : null,
  )
  const [minors, setMinors] = useState<MinorInput[]>([])
  const [legacyBeneficiary, setLegacyBeneficiary] = useState("")

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) ?? null,
    [tiers, selectedTierId],
  )

  useEffect(() => {
    if (selectedTier) {
      setMinors((prev) => ensureMinorsLength(prev, selectedTier.beneficiaries_count))
    } else {
      setMinors([])
    }
  }, [selectedTier])

  function onSubmit() {
    setError(null)

    if (service.allowsMultipleBeneficiaries) {
      if (!selectedTier) {
        setError("Selecciona un plan para continuar.")
        return
      }
      const incomplete = minors.some((m) => m.fullName.trim().length < 2)
      if (incomplete) {
        setError(
          `Ingresa el nombre completo de cada ${service.beneficiaryLabel ?? "beneficiario"}.`,
        )
        return
      }
    }

    startTransition(async () => {
      const res = await createCaseAction({
        serviceSlug: service.slug,
        displayName,
        tierId: selectedTier?.id ?? null,
        minors:
          selectedTier !== null
            ? minors.map((m) => ({
                fullName: m.fullName.trim(),
                dateOfBirth: m.dateOfBirth ?? null,
                documentNumber: m.documentNumber ?? null,
              }))
            : undefined,
        beneficiary:
          !service.allowsMultipleBeneficiaries && service.beneficiaryLabel
            ? { full_name: legacyBeneficiary || undefined }
            : undefined,
      })
      if (!res.ok) {
        setError(messageFor(res.errorCode, res.errorMessage))
        return
      }
      if (res.caseId) router.push(`/cases/${res.caseId}/contract`)
    })
  }

  const priceLabel = selectedTier
    ? Money.fromCents(selectedTier.price_cents).format(locale)
    : Money.fromCents(service.basePriceCents).format(locale)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-6"
    >
      {service.allowsMultipleBeneficiaries ? (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
            1. Selecciona el plan
          </h2>
          <ServiceTierSelector
            tiers={tiers}
            selectedTierId={selectedTierId}
            onSelect={setSelectedTierId}
            locale={locale}
          />
        </section>
      ) : null}

      {selectedTier ? (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
            2. {service.beneficiaryLabel ?? "Beneficiarios"} en este caso
          </h2>
          <p className="text-xs leading-5 text-muted-foreground">
            Estos nombres quedarán registrados en tu contrato y se autorrellenarán en los
            formularios oficiales del distrito judicial.
          </p>
          <MinorListEditor
            minors={minors}
            onChange={setMinors}
            beneficiaryLabel={
              (service.beneficiaryLabel ?? (locale === "es" ? "Beneficiario" : "Beneficiary"))
                .charAt(0)
                .toUpperCase() +
              (
                service.beneficiaryLabel ?? (locale === "es" ? "Beneficiario" : "Beneficiary")
              ).slice(1)
            }
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
          {service.allowsMultipleBeneficiaries ? "3. " : ""}Identificación del caso
        </h2>
        <div className="space-y-1">
          <Label htmlFor="displayName">Nombre del caso</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Personalízalo si manejarás varios casos del mismo servicio (ej. "Custodia — sobrina
            María").
          </p>
        </div>
        {!service.allowsMultipleBeneficiaries && service.beneficiaryLabel ? (
          <div className="space-y-1">
            <Label htmlFor="legacyBeneficiary">
              Nombre del/de la {service.beneficiaryLabel} (opcional)
            </Label>
            <Input
              id="legacyBeneficiary"
              value={legacyBeneficiary}
              onChange={(e) => setLegacyBeneficiary(e.target.value)}
            />
          </div>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="glass-panel flex items-center justify-between rounded-lg p-4">
        <span className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground">
          <BadgeCheck className="size-4 text-primary" aria-hidden />
          Total acordado
        </span>
        <span className="text-2xl font-black text-primary">{priceLabel}</span>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Procesando..." : "Continuar al contrato"}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </form>
  )
}

function messageFor(code: string | undefined, raw: string | undefined): string {
  switch (code) {
    case "residency_required":
      return "Necesitas verificar tu residencia Utah antes de iniciar un caso. Completa el onboarding."
    case "service_not_found":
      return "Servicio no encontrado o no activo."
    case "tier_required":
      return "Selecciona un plan para continuar."
    case "tier_mismatch":
      return "El plan seleccionado no pertenece a este servicio."
    case "minors_count_mismatch":
      return "La cantidad de beneficiarios no coincide con el plan."
    case "validation":
      return "Datos inválidos. Revisa los campos."
    case "auth":
      return "Sesión expirada. Vuelve a iniciar sesión."
    default:
      return raw ?? "Error inesperado. Inténtalo de nuevo."
  }
}
