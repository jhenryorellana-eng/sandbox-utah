"use client"

import { useTranslations } from "next-intl"

export function UplDisclaimer() {
  const t = useTranslations("Filing")
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{t("disclaimerTitle")}</p>
      <p className="mt-1 text-amber-800">{t("uplDisclaimer")}</p>
      <p className="mt-2 text-xs text-amber-700">
        {t("complaintsLeadIn")}{" "}
        <a
          href="https://utahinnovationoffice.org/sandbox-customer-complaint/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          utahinnovationoffice.org
        </a>
      </p>
    </div>
  )
}
