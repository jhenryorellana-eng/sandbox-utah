import { useTranslations } from "next-intl"
import { Link } from "@/lib/i18n/navigation"

const COMPLAINT_URL = "https://utahinnovationoffice.org/sandbox-customer-complaint/"

export function SiteFooter() {
  const t = useTranslations("Footer")
  const tDisc = useTranslations("Disclaimers")
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{t("company")}</p>
          <p>{t("address")}</p>
          <p className="text-xs">{t("rights", { year })}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:underline">
            {t("links.terms")}
          </Link>
          <Link href="/privacy" className="hover:underline">
            {t("links.privacy")}
          </Link>
          <a
            href={COMPLAINT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {t("links.complaint")}
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-screen-xl text-xs italic leading-relaxed">
        {tDisc("notALawFirm")}
      </p>
    </footer>
  )
}
