"use client"

import { ExternalLink, FileText, Printer, Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { FilingFormSnapshot } from "@/shared/types/database"

export interface FormsListProps {
  forms: FilingFormSnapshot[]
  locale: "es" | "en"
  printingFormCode: string | null
  onPrintForm: (formCode: string) => void
}

export function FormsList({ forms, locale, printingFormCode, onPrintForm }: FormsListProps) {
  const t = useTranslations("Filing")
  if (forms.length === 0) {
    return <p className="text-sm italic text-muted-foreground">{t("forms.empty")}</p>
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">{t("forms.code")}</th>
            <th className="px-3 py-2 text-left">{t("forms.name")}</th>
            <th className="px-3 py-2 text-left">{t("forms.type")}</th>
            <th className="px-3 py-2 text-right">{t("forms.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => {
            const name = locale === "en" ? form.name_en : form.name_es
            const isCurrent = printingFormCode === form.form_code
            const canPrintLocal = form.format === "pdf"
            return (
              <tr key={form.form_code} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{form.form_code}</td>
                <td className="px-3 py-2">
                  <p className="flex items-start gap-1">
                    {form.is_mandatory ? (
                      <Star
                        className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span>{name}</span>
                  </p>
                  {form.cached_sha256 ? (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      sha256: {form.cached_sha256.slice(0, 12)}…
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                    <FileText className="h-3 w-3" aria-hidden="true" />
                    {form.format}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <a
                        href={form.url_official}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("forms.viewOfficial")}
                      </a>
                    </Button>
                    {canPrintLocal ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCurrent}
                        onClick={() => onPrintForm(form.form_code)}
                      >
                        <Printer className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                        {isCurrent ? t("actions.printing") : t("actions.printForm")}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
