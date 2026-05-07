"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Money } from "@/shared/domain/money"
import { upsertServiceAction } from "../actions/upsert-service"
import type { ServiceCategoryRow, ServiceWithTiers } from "../repository"

export interface ServiceFormProps {
  service: ServiceWithTiers | null
  categories: ServiceCategoryRow[]
  defaultCategoryId?: string
  onSaved: (serviceId: string) => void
  onCancel: () => void
}

export function ServiceForm({
  service,
  categories,
  defaultCategoryId,
  onSaved,
  onCancel,
}: ServiceFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(() => ({
    id: service?.id ?? null,
    category_id: service?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "",
    slug: service?.slug ?? "",
    name_es: service?.name_es ?? "",
    name_en: service?.name_en ?? "",
    short_description_es: service?.short_description_es ?? "",
    short_description_en: service?.short_description_en ?? "",
    long_description_es: service?.long_description_es ?? "",
    long_description_en: service?.long_description_en ?? "",
    base_price_dollars: service ? Money.fromCents(service.base_price_cents).toDollars() : 0,
    estimated_duration_minutes: service?.estimated_duration_minutes ?? null,
    workflow_slug: service?.workflow_slug ?? "",
    beneficiary_label_es: service?.beneficiary_label_es ?? "",
    beneficiary_label_en: service?.beneficiary_label_en ?? "",
    allows_multiple_beneficiaries: service?.allows_multiple_beneficiaries ?? false,
    is_active: service?.is_active ?? true,
    display_order: service?.display_order ?? 0,
  }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await upsertServiceAction({
        id: form.id,
        category_id: form.category_id,
        slug: form.slug.trim(),
        name_es: form.name_es.trim(),
        name_en: form.name_en.trim(),
        short_description_es: form.short_description_es.trim(),
        short_description_en: form.short_description_en.trim(),
        long_description_es: form.long_description_es.trim() || null,
        long_description_en: form.long_description_en.trim() || null,
        base_price_cents: Money.fromDollars(Number(form.base_price_dollars)).cents,
        estimated_duration_minutes: form.estimated_duration_minutes,
        workflow_slug: form.workflow_slug.trim(),
        beneficiary_label_es: form.beneficiary_label_es.trim() || null,
        beneficiary_label_en: form.beneficiary_label_en.trim() || null,
        allows_multiple_beneficiaries: form.allows_multiple_beneficiaries,
        is_active: form.is_active,
        display_order: form.display_order,
      })
      if (!result.ok) {
        setError(messageForError(result.errorCode, result.errorMessage))
        return
      }
      onSaved(result.serviceId ?? form.id ?? "")
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-border bg-muted/40 p-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Categoría">
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_es}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Slug (kebab-case)">
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="ej. child-custody"
            required
            disabled={!!form.id}
          />
        </Field>
        <Field label="Nombre (ES)">
          <Input
            value={form.name_es}
            onChange={(e) => setForm({ ...form, name_es: e.target.value })}
            required
          />
        </Field>
        <Field label="Nombre (EN)">
          <Input
            value={form.name_en}
            onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            required
          />
        </Field>
        <Field label="Descripción corta (ES)">
          <Input
            value={form.short_description_es}
            onChange={(e) => setForm({ ...form, short_description_es: e.target.value })}
            required
          />
        </Field>
        <Field label="Descripción corta (EN)">
          <Input
            value={form.short_description_en}
            onChange={(e) => setForm({ ...form, short_description_en: e.target.value })}
            required
          />
        </Field>
        <Field label="Precio base (USD)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.base_price_dollars}
            onChange={(e) => setForm({ ...form, base_price_dollars: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Workflow slug">
          <Input
            value={form.workflow_slug}
            onChange={(e) => setForm({ ...form, workflow_slug: e.target.value })}
            placeholder="ej. child-custody"
            required
          />
        </Field>
        <Field label="Etiqueta beneficiario (ES)">
          <Input
            value={form.beneficiary_label_es}
            onChange={(e) => setForm({ ...form, beneficiary_label_es: e.target.value })}
            placeholder="menor, hijo..."
          />
        </Field>
        <Field label="Etiqueta beneficiario (EN)">
          <Input
            value={form.beneficiary_label_en}
            onChange={(e) => setForm({ ...form, beneficiary_label_en: e.target.value })}
            placeholder="minor, child..."
          />
        </Field>
        <Field label="Orden de despliegue">
          <Input
            type="number"
            min={0}
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
          />
        </Field>
        <Field label="Duración estimada (min)">
          <Input
            type="number"
            min={0}
            value={form.estimated_duration_minutes ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                estimated_duration_minutes: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <CheckboxField
          checked={form.allows_multiple_beneficiaries}
          onChange={(v) => setForm({ ...form, allows_multiple_beneficiaries: v })}
        >
          Permite múltiples beneficiarios (habilita tiers)
        </CheckboxField>
        <CheckboxField
          checked={form.is_active}
          onChange={(v) => setForm({ ...form, is_active: v })}
        >
          Activo (visible al público)
        </CheckboxField>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : form.id ? "Guardar cambios" : "Crear servicio"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span>{label}</span>
      <div className="text-sm font-normal normal-case tracking-normal text-foreground">
        {children}
      </div>
    </Label>
  )
}

function CheckboxField({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input"
      />
      <span>{children}</span>
    </label>
  )
}

function messageForError(code?: string, msg?: string): string {
  switch (code) {
    case "validation":
      return "Datos inválidos. Revisa los campos requeridos."
    case "slug_taken":
      return "Ya existe un servicio con ese slug. Usa uno único."
    case "not_admin":
      return "No tienes permisos de administrador."
    case "auth":
      return "Sesión expirada. Vuelve a iniciar sesión."
    default:
      return msg ?? "Error desconocido. Inténtalo de nuevo."
  }
}
