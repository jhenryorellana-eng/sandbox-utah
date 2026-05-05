"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import { reportPaymentAction } from "../actions/report-payment"

interface InstallmentOption {
  id: string
  installmentNumber: number
  amountCents: number
}

const METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "zelle", label: "Zelle" },
  { value: "bank_transfer", label: "Transferencia bancaria" },
  { value: "check", label: "Cheque" },
  { value: "money_order", label: "Money order" },
  { value: "cashapp", label: "Cash App" },
  { value: "venmo", label: "Venmo" },
  { value: "other", label: "Otro" },
]

export function ReportPaymentForm({ installments }: { installments: InstallmentOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [installmentId, setInstallmentId] = useState(installments[0]?.id ?? "")
  const selected = installments.find((i) => i.id === installmentId)

  function onSubmit(formData: FormData) {
    setError(null)
    formData.set("installmentId", installmentId)
    startTransition(async () => {
      const res = await reportPaymentAction(formData)
      if (!res.ok) {
        if (res.errorCode === "no_proof") setError("Debes subir un comprobante.")
        else if (res.errorCode === "file_too_large") setError("Comprobante muy grande (máx 10 MB).")
        else if (res.errorCode === "invalid_type") setError("Tipo de archivo no aceptado.")
        else setError(res.errorMessage ?? "Error")
        return
      }
      router.refresh()
    })
  }

  if (installments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay cuotas pendientes que puedas reportar ahora.
      </p>
    )
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="installment">Cuota</Label>
        <select
          id="installment"
          value={installmentId}
          onChange={(e) => setInstallmentId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {installments.map((i) => (
            <option key={i.id} value={i.id}>
              Cuota #{i.installmentNumber === 0 ? "Enganche" : i.installmentNumber} — $
              {(i.amountCents / 100).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="paymentMethod">Método</Label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="paymentDate">Fecha del pago</Label>
        <Input id="paymentDate" name="paymentDate" type="date" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="amountCents">Monto pagado (USD)</Label>
        <Input
          id="amountCents"
          name="amountCents"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={selected ? (selected.amountCents / 100).toFixed(2) : ""}
          onChange={(e) => {
            const cents = Math.round(Number(e.target.value) * 100)
            e.target.dataset.cents = String(cents)
          }}
        />
        <p className="text-xs text-muted-foreground">
          Indica el monto exacto que pagaste. Si pagaste en centavos, usa decimales.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="paymentMethodDetails">Detalles (opcional)</Label>
        <Input
          id="paymentMethodDetails"
          name="paymentMethodDetails"
          placeholder="Ej: Zelle de juan@email.com"
          maxLength={500}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="proof">Comprobante (foto/PDF)</Label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">
          Captura de Zelle, foto del cheque, recibo de efectivo, etc. Obligatorio.
        </p>
      </div>

      {/* Hack: convertimos el monto USD a cents en el client antes del submit */}
      <input
        type="hidden"
        name="amountCentsHidden"
        ref={(el) => {
          if (!el) return
          el.form?.addEventListener(
            "submit",
            (e) => {
              const dollars = Number((e.target as HTMLFormElement).amountCents.value)
              ;(e.target as HTMLFormElement).amountCents.value = String(Math.round(dollars * 100))
            },
            { once: true },
          )
        }}
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Subiendo..." : "Reportar pago"}
      </Button>
    </form>
  )
}
