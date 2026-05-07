import { useTranslations } from "next-intl"

/**
 * Banner prominente requerido por la Utah Supreme Court (Letter 5 sept 2024)
 * que reemplazó el badge anterior. Debe ser visible sin scroll en cada página.
 *
 * Texto literal en messages/{locale}.json#Disclaimers.complaintBanner.
 */
export function ComplaintBanner() {
  const t = useTranslations("Disclaimers")
  return (
    <aside
      aria-label="Sandbox compliance notice"
      className="border-b border-primary/10 bg-primary px-4 py-2 text-xs font-semibold leading-relaxed text-primary-foreground shadow-[0_8px_24px_oklch(0.31_0.101_257_/_14%)]"
    >
      <p className="mx-auto max-w-screen-xl">{t("complaintBanner")}</p>
    </aside>
  )
}
