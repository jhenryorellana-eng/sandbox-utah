import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <Landing />
}

function Landing() {
  const t = useTranslations("Landing")

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("trustBadge")}
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="text-balance text-lg text-muted-foreground sm:text-xl">{t("subhead")}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  )
}
