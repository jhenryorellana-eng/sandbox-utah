import { useTranslations } from "next-intl"
import { BrandMark } from "@/components/layout/brand-mark"
import { Link } from "@/lib/i18n/navigation"

const COMPLAINT_URL = "https://utahinnovationoffice.org/sandbox-customer-complaint/"

export function SiteFooter() {
  const t = useTranslations("Footer")
  const tDisc = useTranslations("Disclaimers")
  const year = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-white/70 bg-white/55 px-4 py-8 text-sm text-muted-foreground backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <BrandMark />
          <p className="font-extrabold text-foreground">{t("company")}</p>
          <p>{t("address")}</p>
          <p className="text-xs">{t("rights", { year })}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 font-extrabold">
          <Link href="/terms" className="transition hover:text-primary">
            {t("links.terms")}
          </Link>
          <Link href="/privacy" className="transition hover:text-primary">
            {t("links.privacy")}
          </Link>
          <a
            href={COMPLAINT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-primary"
          >
            {t("links.complaint")}
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-5 max-w-screen-xl border-t border-border/70 pt-4 text-xs leading-relaxed">
        {tDisc("notALawFirm")}
      </p>
    </footer>
  )
}
