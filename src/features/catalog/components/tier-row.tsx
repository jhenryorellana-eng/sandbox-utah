"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Money } from "@/shared/domain/money"
import { deleteTierAction, setTierActiveAction, upsertTierAction } from "../actions/upsert-tier"
import type { ServiceTierRow } from "../repository"

interface TierRowProps {
  serviceId: string
  tier: ServiceTierRow | null
  defaultBeneficiariesCount?: number
  onSaved: () => void
  onCancel?: () => void
}

export function TierRow({
  serviceId,
  tier,
  defaultBeneficiariesCount,
  onSaved,
  onCancel,
}: TierRowProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(tier === null)
  const [form, setForm] = useState(() => ({
    id: tier?.id ?? null,
    beneficiaries_count: tier?.beneficiaries_count ?? defaultBeneficiariesCount ?? 1,
    price_dollars: tier ? Money.fromCents(tier.price_cents).toDollars() : 0,
    label_es: tier?.label_es ?? "",
    label_en: tier?.label_en ?? "",
    description_es: tier?.description_es ?? "",
    description_en: tier?.description_en ?? "",
    display_order: tier?.display_order ?? 0,
    is_active: tier?.is_active ?? true,
  }))

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await upsertTierAction({
        id: form.id,
        service_id: serviceId,
        beneficiaries_count: form.beneficiaries_count,
        price_cents: Money.fromDollars(Number(form.price_dollars)).cents,
        label_es: form.label_es.trim(),
        label_en: form.label_en.trim(),
        description_es: form.description_es.trim() || null,
        description_en: form.description_en.trim() || null,
        display_order: form.display_order,
        is_active: form.is_active,
      })
      if (!result.ok) {
        setError(
          result.errorCode === "duplicate_count"
            ? "Ya existe un tier con ese número de beneficiarios."
            : (result.errorMessage ?? "Error al guardar"),
        )
        return
      }
      setEditing(false)
      onSaved()
    })
  }

  function handleToggleActive() {
    if (!tier) return
    startTransition(async () => {
      const result = await setTierActiveAction({ id: tier.id, isActive: !tier.is_active })
      if (result.ok) onSaved()
    })
  }

  function handleDelete() {
    if (!tier) return
    if (!confirm(`¿Eliminar tier "${tier.label_es}"? Si hay casos vinculados se desactivará.`)) {
      return
    }
    startTransition(async () => {
      const result = await deleteTierAction({ id: tier.id })
      if (result.ok) onSaved()
    })
  }

  if (!editing && tier) {
    return (
      <tr className={tier.is_active ? "" : "opacity-50"}>
        <td className="px-2 py-1.5 text-sm">{tier.beneficiaries_count}</td>
        <td className="px-2 py-1.5 text-sm">{Money.fromCents(tier.price_cents).format("es")}</td>
        <td className="px-2 py-1.5 text-sm">{tier.label_es}</td>
        <td className="px-2 py-1.5 text-sm text-muted-foreground">{tier.label_en}</td>
        <td className="px-2 py-1.5 text-sm">{tier.is_active ? "Activo" : "Inactivo"}</td>
        <td className="px-2 py-1.5">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              disabled={pending}
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleToggleActive}
              disabled={pending}
            >
              {tier.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={pending}
            >
              Eliminar
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min={1}
          value={form.beneficiaries_count}
          onChange={(e) => setForm({ ...form, beneficiaries_count: Number(e.target.value) })}
          className="h-8 w-20"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={form.price_dollars}
          onChange={(e) => setForm({ ...form, price_dollars: Number(e.target.value) })}
          className="h-8 w-28"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          value={form.label_es}
          onChange={(e) => setForm({ ...form, label_es: e.target.value })}
          placeholder="Etiqueta ES"
          className="h-8"
        />
      </td>
      <td className="px-2 py-1.5">
        <Input
          value={form.label_en}
          onChange={(e) => setForm({ ...form, label_en: e.target.value })}
          placeholder="Label EN"
          className="h-8"
        />
      </td>
      <td className="px-2 py-1.5 text-sm">{form.is_active ? "Activo" : "Inactivo"}</td>
      <td className="px-2 py-1.5">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={pending}>
              {pending ? "..." : "Guardar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false)
                onCancel?.()
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </td>
    </tr>
  )
}
