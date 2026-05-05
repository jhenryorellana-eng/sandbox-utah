"use client"

import { Loader2, Printer } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { usePrintPacket } from "../hooks/use-print-packet"
import type { PrintScope } from "../schemas/packet-schema"

export interface PrintPacketButtonProps {
  caseId: string
  locale: "es" | "en"
  scope: PrintScope
  formCode?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  labelKey: string
}

export function PrintPacketButton({
  caseId,
  locale,
  scope,
  formCode,
  variant = "default",
  size = "default",
  labelKey,
}: PrintPacketButtonProps) {
  const t = useTranslations("Filing")
  const [{ printing, lastError }, { print }] = usePrintPacket(caseId, locale)
  return (
    <div className="space-y-1">
      <Button
        variant={variant}
        size={size}
        disabled={printing}
        onClick={() => print({ scope, ...(formCode ? { formCode } : {}) })}
      >
        {printing ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        {printing ? t("actions.printing") : t(labelKey)}
      </Button>
      {lastError ? (
        <p className="text-xs text-destructive">{t("actions.printError", { reason: lastError })}</p>
      ) : null}
    </div>
  )
}
