import { useTranslations } from "next-intl"
import { BrandMark } from "@/components/layout/brand-mark"
import { Link } from "@/lib/i18n/navigation"

export function SiteHeader() {
  const t = useTranslations("Nav")

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/72 px-4 py-3 shadow-[0_10px_30px_oklch(0.2_0.047_255_/_6%)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-3">
        <Link href="/" aria-label="USA Latino Prime Utah home" className="group rounded-lg">
          <BrandMark className="transition-transform duration-200 group-hover:-translate-y-0.5" />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/services"
            className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground sm:inline-flex"
          >
            {t("services")}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
          >
            {t("dashboard")}
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="interactive-shine inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-extrabold text-primary-foreground shadow-[0_12px_26px_oklch(0.31_0.101_257_/_18%)] transition hover:-translate-y-0.5 hover:bg-primary/95"
          >
            {t("register")}
          </Link>
        </nav>
      </div>
    </header>
  )
}
