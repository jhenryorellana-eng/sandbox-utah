import { ArrowRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import type { ReactNode } from "react"
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
    <>
      <section className="relative isolate flex min-h-[calc(86svh-7rem)] flex-1 overflow-hidden px-4 py-14 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,oklch(1_0_0_/_92%)_0_40%,oklch(0.31_0.101_257_/_10%)_40%_100%)]" />
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[56%] lg:block">
          <HeroVisual />
        </div>

        <div className="mx-auto flex w-full max-w-screen-xl items-center">
          <div className="max-w-2xl animate-in-up">
            <p className="brand-kicker">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t("trustBadge")}
            </p>
            <h1 className="mt-5 text-balance text-5xl font-black leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              USA Latino Prime <span className="flag-text">Utah</span>
            </h1>
            <p className="mt-5 max-w-xl text-balance text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
              {t("headline")}
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("subhead")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="interactive-shine inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-black text-primary-foreground shadow-[0_18px_36px_oklch(0.31_0.101_257_/_22%)] transition hover:-translate-y-0.5 hover:bg-primary/95"
              >
                {t("ctaPrimary")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-white/72 px-6 text-sm font-black text-foreground shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-md"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="mx-auto grid max-w-screen-xl gap-4 border-y border-border/70 py-8 md:grid-cols-3">
          <LandingPoint icon={<FileCheck2 className="size-5" />} title="Formularios oficiales" />
          <LandingPoint icon={<Sparkles className="size-5" />} title="Extraccion IA revisable" />
          <LandingPoint icon={<ShieldCheck className="size-5" />} title="Sandbox + compliance" />
        </div>
      </section>
    </>
  )
}

function LandingPoint({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        {icon}
      </span>
      <p className="text-sm font-black text-foreground">{title}</p>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-y-8 right-0 w-[88%] rounded-l-[3rem] bg-primary shadow-[inset_0_0_0_1px_oklch(1_0_0_/_10%),0_32px_90px_oklch(0.2_0.047_255_/_20%)]" />
      <div className="absolute top-16 right-14 h-28 w-56 rotate-6 rounded-lg bg-accent/90 shadow-2xl" />
      <div className="absolute top-28 right-24 w-[31rem] rotate-[-5deg] rounded-lg border border-white/70 bg-white/88 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Utah courts packet
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
            Ready
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-3 w-4/5 rounded bg-primary/20" />
          <div className="h-3 w-2/3 rounded bg-primary/14" />
          <div className="h-3 w-5/6 rounded bg-primary/14" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 bg-secondary/70 p-3">
              <div className="h-2 w-14 rounded bg-accent/70" />
              <div className="mt-3 h-2 w-full rounded bg-primary/16" />
              <div className="mt-2 h-2 w-4/5 rounded bg-primary/12" />
            </div>
            <div className="rounded-lg border border-border/70 bg-secondary/70 p-3">
              <div className="h-2 w-16 rounded bg-primary/50" />
              <div className="mt-3 h-2 w-full rounded bg-primary/16" />
              <div className="mt-2 h-2 w-3/5 rounded bg-primary/12" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-10 bottom-20 w-72 rotate-3 rounded-lg border border-white/70 bg-white/80 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-black">AI prefill</p>
            <p className="text-xs text-muted-foreground">Profile + documents + case data</p>
          </div>
        </div>
      </div>
    </div>
  )
}
