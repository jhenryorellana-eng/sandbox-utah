"use client"

import { useTranslations } from "next-intl"
import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { saveFormDataAction } from "../actions/save-form-data"

interface WizardField {
  id: string
  type: "text" | "date" | "tel" | "email" | "select" | "textarea" | "checkbox" | "number"
  labelEs: string
  labelEn: string
  hintEs?: string
  hintEn?: string
  required?: boolean
  options?: { value: string; labelEs: string; labelEn: string }[]
  placeholder?: string
}

interface WizardStep {
  id: string
  titleEs: string
  titleEn: string
  descriptionEs?: string | undefined
  descriptionEn?: string | undefined
  fields: WizardField[]
}

interface WizardRuntimeProps {
  caseId: string
  steps: WizardStep[]
  initialData: Record<string, unknown>
  initialStepId: string
  completedSteps: string[]
  locale: Locale
}

const AUTO_SAVE_DEBOUNCE_MS = 2_000

export function WizardRuntime({
  caseId,
  steps,
  initialData,
  initialStepId,
  completedSteps: initialCompleted,
  locale,
}: WizardRuntimeProps) {
  const router = useRouter()
  const t = useTranslations()
  const [data, setData] = useState<Record<string, unknown>>(initialData)
  const [stepId, setStepId] = useState(initialStepId)
  const [completed, setCompleted] = useState(new Set(initialCompleted))
  const [pending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stepIndex = steps.findIndex((s) => s.id === stepId)
  const step = steps[stepIndex]
  const isFinal = stepIndex === steps.length - 1
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  const persistDraft = useCallback(
    (snapshot: Record<string, unknown>, currentStepId: string) => {
      try {
        localStorage.setItem(
          `case-draft:${caseId}`,
          JSON.stringify({ stepId: currentStepId, data: snapshot, savedAt: Date.now() }),
        )
      } catch {
        // localStorage puede fallar en navegación privada
      }
    },
    [caseId],
  )

  function setField(fieldId: string, value: unknown) {
    const next = { ...data, [fieldId]: value }
    setData(next)
    persistDraft(next, stepId)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void saveFormDataAction({ caseId, stepId, data: next, markComplete: false })
    }, AUTO_SAVE_DEBOUNCE_MS)
  }

  function commitStep(next: "next" | "submit") {
    setFieldErrors({})
    startTransition(async () => {
      const res = await saveFormDataAction({
        caseId,
        stepId,
        data,
        markComplete: true,
      })
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }
      const newCompleted = new Set(completed)
      newCompleted.add(stepId)
      setCompleted(newCompleted)
      if (next === "submit") {
        router.push(`/cases/${caseId}/review`)
      } else {
        const nextStep = steps[stepIndex + 1]
        if (nextStep) setStepId(nextStep.id)
      }
    })
  }

  function goBack() {
    const prev = steps[stepIndex - 1]
    if (prev) setStepId(prev.id)
  }

  const stepTitle = useMemo(
    () => (locale === "es" ? step?.titleEs : step?.titleEn) ?? "",
    [step, locale],
  )

  if (!step) return null

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-panel space-y-3 rounded-lg p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          {t("Onboarding.stepOf", { step: stepIndex + 1, total: steps.length })}
        </p>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Wizard progress"
          className="h-2 w-full overflow-hidden rounded-full bg-secondary shadow-inner"
        >
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h2 className="text-2xl font-black tracking-normal">{stepTitle}</h2>
        {step.descriptionEs && (
          <p className="text-muted-foreground">
            {locale === "es" ? step.descriptionEs : step.descriptionEn}
          </p>
        )}
      </header>

      <div className="rounded-lg border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          {step.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              locale={locale}
              value={data[field.id]}
              error={fieldErrors[field.id]}
              onChange={(v) => setField(field.id, v)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stepIndex > 0 && (
          <Button type="button" variant="ghost" onClick={goBack} disabled={pending}>
            ← {t("Onboarding.back")}
          </Button>
        )}
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              await saveFormDataAction({ caseId, stepId, data, markComplete: false })
            })
          }
          disabled={pending}
        >
          {t("Onboarding.saveAndExit")}
        </Button>
        <Button
          type="button"
          onClick={() => commitStep(isFinal ? "submit" : "next")}
          disabled={pending}
        >
          {pending ? "..." : isFinal ? "Revisar y firmar" : t("Onboarding.next")}
        </Button>
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  locale,
  value,
  error,
  onChange,
}: {
  field: WizardField
  locale: Locale
  value: unknown
  error?: string | undefined
  onChange: (value: unknown) => void
}) {
  const label = locale === "es" ? field.labelEs : field.labelEn
  const hint = locale === "es" ? field.hintEs : field.hintEn

  if (field.type === "checkbox") {
    return (
      <div className="flex items-start gap-2">
        <input
          id={field.id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <div className="space-y-1">
          <Label htmlFor={field.id} className="cursor-pointer">
            {label}
          </Label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    )
  }

  if (field.type === "select" && field.options) {
    return (
      <div className="space-y-1">
        <Label htmlFor={field.id}>{label}</Label>
        <select
          id={field.id}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-input bg-white/76 px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl"
        >
          <option value="">--</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {locale === "es" ? opt.labelEs : opt.labelEn}
            </option>
          ))}
        </select>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        <Label htmlFor={field.id}>{label}</Label>
        <textarea
          id={field.id}
          rows={4}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex w-full rounded-lg border border-input bg-white/76 px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl"
        />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={field.id}>{label}</Label>
      <Input
        id={field.id}
        type={field.type === "number" ? "number" : field.type}
        value={(value as string | number | undefined)?.toString() ?? ""}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(e) =>
          onChange(
            field.type === "number"
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
