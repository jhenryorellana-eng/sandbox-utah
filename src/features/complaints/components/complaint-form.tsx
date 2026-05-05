"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Locale } from "@/lib/i18n/routing"
import { submitComplaintAction } from "../actions/submit-complaint"

const CATEGORIES_ES = [
  { value: "inaccurate_result", label: "Resultado inexacto o inadecuado" },
  { value: "failed_exercise_rights", label: "No pude ejercer mis derechos" },
  { value: "unnecessary_service", label: "Servicio innecesario o no aplicable" },
  { value: "billing", label: "Cobros o pagos" },
  { value: "technical", label: "Falla técnica" },
  { value: "other", label: "Otro" },
] as const

const CATEGORIES_EN = [
  { value: "inaccurate_result", label: "Inaccurate or inappropriate result" },
  { value: "failed_exercise_rights", label: "I couldn't exercise my rights" },
  { value: "unnecessary_service", label: "Unnecessary or inappropriate service" },
  { value: "billing", label: "Billing or payment" },
  { value: "technical", label: "Technical issue" },
  { value: "other", label: "Other" },
] as const

export function ComplaintForm({
  locale,
  defaultEmail,
  caseId,
}: {
  locale: Locale
  defaultEmail?: string
  caseId?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ number: string } | null>(null)
  const categories = locale === "es" ? CATEGORIES_ES : CATEGORIES_EN

  function onSubmit(formData: FormData) {
    setError(null)
    const payload = {
      ...(caseId ? { caseId } : {}),
      reporterEmail: String(formData.get("reporterEmail") ?? ""),
      reporterName: String(formData.get("reporterName") ?? "") || undefined,
      category: String(formData.get("category") ?? "other"),
      subject: String(formData.get("subject") ?? ""),
      description: String(formData.get("description") ?? ""),
      locale,
    }
    startTransition(async () => {
      const res = await submitComplaintAction(payload)
      if (!res.ok) {
        setError(res.errorMessage ?? "Error")
        return
      }
      setSubmitted({ number: res.complaintNumber ?? "" })
    })
  }

  if (submitted) {
    return (
      <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-medium text-emerald-900">
          {locale === "es" ? "Queja recibida" : "Complaint received"}
        </p>
        <p>
          {locale === "es" ? "Número de queja:" : "Complaint number:"}{" "}
          <strong>{submitted.number}</strong>
        </p>
        <p>
          {locale === "es"
            ? "Te responderemos en 5 días hábiles. También puedes reportar directamente al Utah Office of Legal Services Innovation:"
            : "We will respond in 5 business days. You can also report directly to the Utah Office of Legal Services Innovation:"}
        </p>
        <a
          className="block text-primary underline"
          href="https://utahinnovationoffice.org/sandbox-customer-complaint/"
          target="_blank"
          rel="noopener noreferrer"
        >
          utahinnovationoffice.org/sandbox-customer-complaint/
        </a>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-1">
        <Label htmlFor="reporterEmail">{locale === "es" ? "Tu correo" : "Your email"}</Label>
        <Input
          id="reporterEmail"
          name="reporterEmail"
          type="email"
          required
          defaultValue={defaultEmail ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reporterName">
          {locale === "es" ? "Tu nombre (opcional)" : "Your name (optional)"}
        </Label>
        <Input id="reporterName" name="reporterName" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="category">{locale === "es" ? "Categoría" : "Category"}</Label>
        <select
          id="category"
          name="category"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">{locale === "es" ? "Asunto" : "Subject"}</Label>
        <Input id="subject" name="subject" required minLength={3} maxLength={160} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">{locale === "es" ? "Descripción" : "Description"}</Label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "..." : locale === "es" ? "Enviar queja" : "Submit complaint"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {locale === "es"
          ? "También puedes reportar directamente al Utah Office of Legal Services Innovation: utahinnovationoffice.org/sandbox-customer-complaint/"
          : "You can also report directly to the Utah Office of Legal Services Innovation: utahinnovationoffice.org/sandbox-customer-complaint/"}
      </p>
    </form>
  )
}
