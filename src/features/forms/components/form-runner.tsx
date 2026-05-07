"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormBundleField, FormBundleGroup } from "../actions/fetch-bundle"
import { printFormAction } from "../actions/print-form"
import { saveFormResponseAction } from "../actions/save-response"

export interface FormRunnerProps {
  caseId: string
  formSlug: string
  formName: string
  groups: FormBundleGroup[]
  initialValues: Record<string, unknown>
  sources: Record<string, { from: string; refId?: string } | null>
  status: string
  locale: "es" | "en"
}

export function FormRunner({
  caseId,
  formSlug,
  formName,
  groups,
  initialValues,
  sources,
  status: initialStatus,
  locale,
}: FormRunnerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>(() => normalizeValues(initialValues))
  const [error, setError] = useState<string | null>(null)
  const [errorByField, setErrorByField] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string>(initialStatus)

  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errorByField[name]) {
      setErrorByField((prev) => {
        const { [name]: _omit, ...rest } = prev
        return rest
      })
    }
  }

  function save(submit: boolean) {
    setError(null)
    setErrorByField({})
    startTransition(async () => {
      const responses = denormalizeValues(values)
      const result = await saveFormResponseAction({
        caseId,
        formSlug,
        responses,
        submit,
      })
      if (!result.ok) {
        if (result.errorCode === "schema_invalid" && result.errorMessages) {
          setErrorByField(result.errorMessages)
          setError("Hay errores en el formulario. Revisa los campos marcados.")
          return
        }
        setError("No se pudo guardar el formulario.")
        return
      }
      setStatus(submit ? "submitted" : "draft")
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save(true)
      }}
      className="space-y-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{formName}</h2>
          <p className="text-xs text-muted-foreground">Estado: {labelForStatus(status, locale)}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => save(false)}>
            {pending ? "..." : locale === "es" ? "Guardar borrador" : "Save draft"}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "..." : locale === "es" ? "Marcar como completado" : "Mark complete"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const responses = denormalizeValues(values)
                const saveResult = await saveFormResponseAction({
                  caseId,
                  formSlug,
                  responses,
                  submit: false,
                })
                if (!saveResult.ok) {
                  setError("No se pudo guardar antes de imprimir.")
                  return
                }
                const printResult = await printFormAction({ caseId, formSlug })
                if (!printResult.ok) {
                  setError(
                    locale === "es"
                      ? "No se pudo generar el PDF. Inténtalo de nuevo."
                      : "Could not generate PDF. Try again.",
                  )
                  return
                }
                if (printResult.signedUrl) {
                  window.open(printResult.signedUrl, "_blank", "noopener")
                }
                router.refresh()
              })
            }}
          >
            {pending ? "..." : locale === "es" ? "Imprimir PDF" : "Print PDF"}
          </Button>
        </div>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {groups.map((group) => (
        <section key={group.title_es} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {locale === "es" ? group.title_es : group.title_en}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {group.fields.map((field) => (
              <FieldEditor
                key={field.name}
                field={field}
                value={values[field.name] ?? ""}
                source={sources[field.name] ?? null}
                error={errorByField[field.name] ?? null}
                onChange={(v) => setField(field.name, v)}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ))}
    </form>
  )
}

function FieldEditor({
  field,
  value,
  source,
  error,
  onChange,
  locale,
}: {
  field: FormBundleField
  value: string
  source: { from: string; refId?: string } | null
  error: string | null
  onChange: (v: string) => void
  locale: "es" | "en"
}) {
  const isAutofilled = source !== null && value.length > 0
  const label = locale === "es" ? field.label_es : field.label_en

  return (
    <div className={field.multiline ? "md:col-span-2" : undefined}>
      <Label htmlFor={field.name}>
        {label}
        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {field.multiline ? (
        <textarea
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={3}
          className={
            "mt-1 flex min-h-[5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
            (isAutofilled ? "border-primary/40 bg-primary/5" : "")
          }
        />
      ) : (
        <Input
          id={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={isAutofilled ? "mt-1 border-primary/40 bg-primary/5" : "mt-1"}
        />
      )}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {isAutofilled ? (
          <span
            className="inline-flex items-center gap-1 text-xs text-primary"
            title={`Origen: ${source?.from}`}
          >
            <span aria-hidden>✨</span>
            {locale === "es"
              ? `Pre-rellenado por IA (${labelForSource(source?.from, locale)})`
              : `Auto-filled (${labelForSource(source?.from, locale)})`}
          </span>
        ) : null}
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    </div>
  )
}

function labelForSource(from: string | undefined, locale: "es" | "en"): string {
  switch (from) {
    case "minor":
      return locale === "es" ? "datos del menor" : "minor data"
    case "document":
      return locale === "es" ? "documento subido" : "uploaded document"
    case "case":
      return locale === "es" ? "wizard del caso" : "case wizard"
    case "profile":
      return locale === "es" ? "tu perfil" : "your profile"
    default:
      return locale === "es" ? "tu información" : "your information"
  }
}

function labelForStatus(status: string, locale: "es" | "en"): string {
  const map: Record<string, { es: string; en: string }> = {
    draft: { es: "Borrador", en: "Draft" },
    submitted: { es: "Marcado completo", en: "Marked complete" },
    printed: { es: "Impreso", en: "Printed" },
  }
  return map[status]?.[locale] ?? status
}

function normalizeValues(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue
    out[key] = String(value)
  }
  return out
}

function denormalizeValues(input: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    out[key] = value === "" ? null : value
  }
  return out
}
