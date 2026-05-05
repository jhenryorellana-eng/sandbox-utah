import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@/lib/i18n/routing"

export default async function OfflinePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <OfflineContent />
}

function OfflineContent() {
  const t = useTranslations("Offline")
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <span aria-hidden className="text-5xl">
          📡
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("body")}</p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {t("retry")}
        </a>
      </div>
    </section>
  )
}
