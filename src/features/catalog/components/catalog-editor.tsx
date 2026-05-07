"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Money } from "@/shared/domain/money"
import { setServiceActiveAction } from "../actions/upsert-service"
import type {
  CategoryWithServicesAndTiers,
  ServiceCategoryRow,
  ServiceWithTiers,
} from "../repository"
import { ServiceForm } from "./service-form"
import { TierRow } from "./tier-row"

export interface CatalogEditorProps {
  catalog: CategoryWithServicesAndTiers[]
}

type FormState =
  | { mode: "idle" }
  | { mode: "edit-service"; categoryId: string; service: ServiceWithTiers | null }

export function CatalogEditor({ catalog }: CatalogEditorProps) {
  const router = useRouter()
  const [state, setState] = useState<FormState>({ mode: "idle" })
  const [newTierFor, setNewTierFor] = useState<string | null>(null)
  const [_, startTransition] = useTransition()

  const categories: ServiceCategoryRow[] = catalog.map(({ services: _services, ...rest }) => rest)

  function refresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {state.mode === "edit-service" ? (
        <ServiceForm
          service={state.service}
          categories={categories}
          defaultCategoryId={state.categoryId}
          onSaved={() => {
            setState({ mode: "idle" })
            refresh()
          }}
          onCancel={() => setState({ mode: "idle" })}
        />
      ) : null}

      {catalog.map((category) => (
        <Card key={category.id}>
          <CardContent className="space-y-4 py-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{category.name_es}</h2>
                <p className="text-xs text-muted-foreground">
                  {category.services.length} servicio(s) ·{" "}
                  {category.is_active ? "activa" : "inactiva"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setState({ mode: "edit-service", categoryId: category.id, service: null })
                }
              >
                + Nuevo servicio
              </Button>
            </header>

            <div className="space-y-3">
              {category.services.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay servicios en esta categoría.
                </p>
              ) : null}
              {category.services.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  onEdit={() =>
                    setState({ mode: "edit-service", categoryId: category.id, service: s })
                  }
                  onToggleActive={() => refresh()}
                  newTierEditing={newTierFor === s.id}
                  onStartNewTier={() => setNewTierFor(s.id)}
                  onTierSaved={() => {
                    setNewTierFor(null)
                    refresh()
                  }}
                  onCancelNewTier={() => setNewTierFor(null)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ServiceRow({
  service,
  onEdit,
  onToggleActive,
  newTierEditing,
  onStartNewTier,
  onTierSaved,
  onCancelNewTier,
}: {
  service: ServiceWithTiers
  onEdit: () => void
  onToggleActive: () => void
  newTierEditing: boolean
  onStartNewTier: () => void
  onTierSaved: () => void
  onCancelNewTier: () => void
}) {
  const [pending, startTransition] = useTransition()

  function toggleActive() {
    startTransition(async () => {
      await setServiceActiveAction({ id: service.id, isActive: !service.is_active })
      onToggleActive()
    })
  }

  const nextBeneficiariesCount = (() => {
    const used = new Set(service.tiers.map((t) => t.beneficiaries_count))
    for (let i = 1; i <= 20; i++) if (!used.has(i)) return i
    return service.tiers.length + 1
  })()

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-medium">
            {service.name_es}{" "}
            <span className="font-mono text-xs text-muted-foreground">/{service.slug}</span>
          </h3>
          <p className="text-sm text-muted-foreground">{service.short_description_es}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Precio base: {Money.fromCents(service.base_price_cents).format("es")} · workflow{" "}
            <code className="rounded bg-muted px-1">{service.workflow_slug}</code>
            {service.allows_multiple_beneficiaries ? " · multi-beneficiario (usa tiers)" : null}
            {service.is_active ? "" : " · INACTIVO"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={pending}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleActive} disabled={pending}>
            {service.is_active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </div>

      {service.allows_multiple_beneficiaries ? (
        <div className="mt-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Tiers (precios por # beneficiarios)</h4>
            {!newTierEditing ? (
              <Button size="sm" variant="outline" onClick={onStartNewTier}>
                + Agregar tier
              </Button>
            ) : null}
          </div>
          {service.tiers.length === 0 && !newTierEditing ? (
            <p className="text-xs text-muted-foreground">
              Sin tiers todavía. Agrega al menos uno para que el cliente pueda seleccionar un plan.
            </p>
          ) : null}
          {service.tiers.length > 0 || newTierEditing ? (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left"># benef.</th>
                  <th className="px-2 py-1 text-left">Precio</th>
                  <th className="px-2 py-1 text-left">Etiqueta ES</th>
                  <th className="px-2 py-1 text-left">Label EN</th>
                  <th className="px-2 py-1 text-left">Estado</th>
                  <th className="px-2 py-1" />
                </tr>
              </thead>
              <tbody>
                {service.tiers
                  .slice()
                  .sort(
                    (a, b) =>
                      a.display_order - b.display_order ||
                      a.beneficiaries_count - b.beneficiaries_count,
                  )
                  .map((tier) => (
                    <TierRow
                      key={tier.id}
                      serviceId={service.id}
                      tier={tier}
                      onSaved={onTierSaved}
                    />
                  ))}
                {newTierEditing ? (
                  <TierRow
                    serviceId={service.id}
                    tier={null}
                    defaultBeneficiariesCount={nextBeneficiariesCount}
                    onSaved={onTierSaved}
                    onCancel={onCancelNewTier}
                  />
                ) : null}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
