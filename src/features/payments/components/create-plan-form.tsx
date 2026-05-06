"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import { Money } from "@/shared/domain/money"
import { createPaymentPlanAction } from "../actions/create-plan"
import { buildSchedule } from "../schedule"

/**
 * Form admin para crear un payment_plan asociado a un caso. Soporta:
 *   - one_time (default): una cuota igual al total acordado.
 *   - installments: 1-36 cuotas + enganche opcional + cadencia.
 *
 * Decisiones de UX (defaults razonables; ajustables luego):
 *   - payment_type default: "one_time" (más simple, sin riesgo de impago).
 *   - cadence default: "monthly" (estándar de la industria).
 *   - precio default: agreed_price_cents del catálogo, pero editable
 *     (admin puede aplicar descuento o recargo según negociación).
 */

interface CreatePlanFormProps {
  caseId: string
  agreedPriceCents: number
  locale: "es" | "en"
}

const TODAY = new Date().toISOString().slice(0, 10)
const PLUS_SEVEN = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export function CreatePlanForm({ caseId, agreedPriceCents, locale }: CreatePlanFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<"one_time" | "installments">("one_time")
  const [totalUsd, setTotalUsd] = useState<string>((agreedPriceCents / 100).toFixed(2))
  const [numInstallments, setNumInstallments] = useState<number>(3)
  const [downPaymentUsd, setDownPaymentUsd] = useState<string>("0")
  const [cadence, setCadence] = useState<"monthly" | "biweekly" | "weekly">("monthly")
  const [firstDueDate, setFirstDueDate] = useState<string>(PLUS_SEVEN)
  const [notes, setNotes] = useState<string>("")

  const totalCents = Math.max(0, Math.round(Number(totalUsd) * 100))
  const downPaymentCents = Math.max(0, Math.round(Number(downPaymentUsd) * 100))

  const preview = useMemo(() => {
    if (totalCents <= 0) return []
    if (paymentType === "installments" && downPaymentCents > totalCents) return []
    try {
      return buildSchedule({
        totalCents,
        paymentType,
        numInstallments,
        downPaymentCents: paymentType === "installments" ? downPaymentCents : 0,
        firstDueDate: new Date(firstDueDate),
        cadence,
      })
    } catch {
      return []
    }
  }, [totalCents, paymentType, numInstallments, downPaymentCents, firstDueDate, cadence])

  const submit = () => {
    setError(null)
    if (totalCents <= 0) {
      setError("El total debe ser mayor a $0")
      return
    }
    if (paymentType === "installments" && downPaymentCents > totalCents) {
      setError("El enganche no puede ser mayor al total")
      return
    }
    startTransition(async () => {
      const res = await createPaymentPlanAction({
        caseId,
        totalCents,
        paymentType,
        numInstallments: paymentType === "installments" ? numInstallments : 1,
        downPaymentCents: paymentType === "installments" ? downPaymentCents : 0,
        firstDueDate,
        cadence,
        notes: notes.trim() || undefined,
      })
      if (!res.ok) {
        setError(res.errorMessage ?? `Error: ${res.errorCode ?? "unknown"}`)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo de plan */}
      <div className="space-y-1">
        <Label>Tipo de plan</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentType("one_time")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
              paymentType === "one_time"
                ? "border-primary bg-primary/10 font-medium"
                : "border-input hover:bg-secondary"
            }`}
            disabled={pending}
          >
            Pago único
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("installments")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
              paymentType === "installments"
                ? "border-primary bg-primary/10 font-medium"
                : "border-input hover:bg-secondary"
            }`}
            disabled={pending}
          >
            En cuotas
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="space-y-1">
        <Label htmlFor="totalUsd">Total acordado (USD)</Label>
        <Input
          id="totalUsd"
          type="number"
          step="0.01"
          min="0.01"
          value={totalUsd}
          onChange={(e) => setTotalUsd(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Precio del catálogo: {Money.fromCents(agreedPriceCents).format(locale)}. Edítalo si
          pactaste descuento o recargo.
        </p>
      </div>

      {/* Installments-specific */}
      {paymentType === "installments" && (
        <div className="grid gap-4 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="numInstallments">Número de cuotas</Label>
            <Input
              id="numInstallments"
              type="number"
              min="1"
              max="36"
              value={numInstallments}
              onChange={(e) =>
                setNumInstallments(Math.max(1, Math.min(36, Number(e.target.value))))
              }
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="downPaymentUsd">Enganche (USD)</Label>
            <Input
              id="downPaymentUsd"
              type="number"
              step="0.01"
              min="0"
              value={downPaymentUsd}
              onChange={(e) => setDownPaymentUsd(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cadence">Cadencia</Label>
            <select
              id="cadence"
              value={cadence}
              onChange={(e) => setCadence(e.target.value as typeof cadence)}
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="monthly">Mensual</option>
              <option value="biweekly">Quincenal</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="firstDueDate">Primera fecha de cuota</Label>
            <Input
              id="firstDueDate"
              type="date"
              min={TODAY}
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
      )}

      {paymentType === "one_time" && (
        <div className="space-y-1">
          <Label htmlFor="firstDueDate">Fecha de pago</Label>
          <Input
            id="firstDueDate"
            type="date"
            min={TODAY}
            value={firstDueDate}
            onChange={(e) => setFirstDueDate(e.target.value)}
            disabled={pending}
          />
        </div>
      )}

      {/* Notas */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notas internas (opcional)</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
          maxLength={500}
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Ej: cliente pagará primera cuota en efectivo en oficina."
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Cronograma resultante
          </p>
          <ul className="mt-2 divide-y divide-emerald-200/60 text-sm">
            {preview.map((p) => (
              <li key={p.installmentNumber} className="flex justify-between py-1.5">
                <span>
                  {p.isDownPayment
                    ? "Enganche"
                    : paymentType === "one_time"
                      ? "Pago único"
                      : `Cuota ${p.installmentNumber}`}
                  <span className="ml-2 text-xs text-muted-foreground">{p.dueDate}</span>
                </span>
                <span className="font-medium">{Money.fromCents(p.amountCents).format(locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Creando…" : "Crear plan de pagos"}
        </Button>
      </div>
    </div>
  )
}
