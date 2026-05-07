import type { Metadata } from "next"
import { useTranslations } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

const SECTION_KEYS = [
  "intro",
  "notALawFirm",
  "scope",
  "userResponsibility",
  "ai",
  "fees",
  "termination",
  "complaints",
  "law",
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Legal.terms" })
  return { title: t("title") }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)
  return <TermsContent />
}

function TermsContent() {
  const t = useTranslations("Legal")
  const tt = useTranslations("Legal.terms")

  return (
    <article className="page-shell flex-1 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex text-sm font-extrabold text-muted-foreground transition hover:text-primary"
          >
            {t("backHome")}
          </Link>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{tt("title")}</h1>
          <p className="text-sm text-muted-foreground">{tt("subtitle")}</p>
          <p className="text-xs text-muted-foreground">{t("lastUpdated")}</p>
        </header>
        <div className="prose-sandbox space-y-6 text-sm leading-relaxed text-foreground">
          {SECTION_KEYS.map((key) => (
            <section key={key} className="space-y-2">
              <h2 className="text-base font-extrabold">{tt(`sections.${key}.heading`)}</h2>
              <p className="text-muted-foreground">{tt(`sections.${key}.body`)}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
