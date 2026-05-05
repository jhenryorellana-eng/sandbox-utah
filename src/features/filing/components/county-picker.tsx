"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { type DistrictId, groupCountiesByDistrict } from "@/server/legal/utah-courts/county-mapper"
import { confirmCountyForCase } from "../actions/confirm-county"

export interface CountyPickerProps {
  caseId: string
  reason?: string | null
  suggestedCity?: string | null
}

export function CountyPicker({ caseId, reason, suggestedCity }: CountyPickerProps) {
  const t = useTranslations("Filing")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const grouped = groupCountiesByDistrict()

  const submit = () => {
    if (!selected) return
    startTransition(async () => {
      setError(null)
      const res = await confirmCountyForCase({ caseId, countyFips: selected })
      if (!res.ok) {
        setError(res.error ?? "internal_error")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold">{t("countyPicker.title")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {reason
          ? t(`errors.${reason}`, { default: t("countyPicker.subtitle") })
          : t("countyPicker.subtitle")}
      </p>
      {suggestedCity ? (
        <p className="mt-1 text-xs text-amber-700">
          {t("countyPicker.suggestion", { city: suggestedCity })}
        </p>
      ) : null}
      <div className="mt-3 space-y-1">
        <Label htmlFor="county">{t("countyPicker.label")}</Label>
        <select
          id="county"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">— {t("countyPicker.placeholder")} —</option>
          {(
            Object.entries(grouped) as Array<
              [string, ReturnType<typeof groupCountiesByDistrict>[DistrictId]]
            >
          ).map(([districtId, list]) => (
            <optgroup
              key={districtId}
              label={t("countyPicker.districtGroup", { id: Number(districtId) })}
            >
              {list.map((c) => (
                <option key={c.fipsCode} value={c.fipsCode}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{t(`errors.${error}`, { default: error })}</p>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Button onClick={submit} disabled={!selected || isPending}>
          {isPending ? t("actions.submitting") : t("countyPicker.submit")}
        </Button>
      </div>
    </div>
  )
}
