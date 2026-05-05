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
      className="border-b border-border bg-secondary/60 px-4 py-2 text-xs leading-relaxed text-secondary-foreground"
    >
      <p className="mx-auto max-w-screen-xl">{t("complaintBanner")}</p>
    </aside>
  )
}
