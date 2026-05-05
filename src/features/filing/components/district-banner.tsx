"use client"

import { Building2, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import type { FilingResolvedFrom } from "@/shared/types/database"

export interface DistrictBannerProps {
  districtId: number
  districtNameEs: string
  districtNameEn: string
  countyName: string
  countyFips: string
  resolvedFrom: FilingResolvedFrom
  locale: "es" | "en"
}

export function DistrictBanner(props: DistrictBannerProps) {
  const t = useTranslations("Filing")
  const districtName = props.locale === "en" ? props.districtNameEn : props.districtNameEs
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-emerald-100 p-2 text-emerald-700">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t("districtBanner.label")}
          </p>
          <p className="mt-0.5 text-base font-semibold text-emerald-950">
            {t("districtBanner.title", { id: props.districtId, name: districtName })}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-emerald-800">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t("districtBanner.county", { name: props.countyName })}
            <span className="text-xs text-emerald-700">({props.countyFips})</span>
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            {t(`districtBanner.source.${props.resolvedFrom}`)}
          </p>
        </div>
      </div>
    </div>
  )
}
