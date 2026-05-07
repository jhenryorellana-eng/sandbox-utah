import { redirect } from "next/navigation"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signOutAction } from "@/features/auth/actions/sign-out"
import { CaseListCard } from "@/features/cases/components/case-list-card"
import { type CaseWithService, fetchCasesByClient } from "@/features/cases/repository"
import { fetchUserActiveVerification } from "@/features/identity/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, preferred_language, utah_residency_verified, date_of_birth")
    .eq("id", user.id)
    .single()

  const verification = await fetchUserActiveVerification(user.id)
  const cases = await fetchCasesByClient(user.id)

  const onboardingComplete = !!profile?.full_name && !!profile?.date_of_birth
  const residencyApproved = !!profile?.utah_residency_verified

  const displayName =
    profile?.full_name?.trim() || profile?.email?.split("@")[0] || user.email?.split("@")[0] || ""

  return (
    <Dashboard
      locale={locale}
      displayName={displayName}
      onboardingComplete={onboardingComplete}
      residencyApproved={residencyApproved}
      verificationStatus={verification?.status ?? null}
      rejectionReason={verification?.rejection_reason ?? null}
      cases={cases}
    />
  )
}

function Dashboard({
  locale,
  displayName,
  onboardingComplete,
  residencyApproved,
  verificationStatus,
  rejectionReason,
  cases,
}: {
  locale: Locale
  displayName: string
  onboardingComplete: boolean
  residencyApproved: boolean
  verificationStatus: string | null
  rejectionReason: string | null
  cases: CaseWithService[]
}) {
  const t = useTranslations("Dashboard")
  const tNav = useTranslations("Nav")
  const tIdentity = useTranslations("Identity")

  const activeCases = cases.filter(
    (c) => c.intake_status !== "archived" && c.intake_status !== "cancelled",
  )
  const archivedCases = cases.filter(
    (c) => c.intake_status === "archived" || c.intake_status === "cancelled",
  )

  return (
    <section className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("welcome", { name: displayName || "👋" })}
        </h1>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <Button variant="outline" type="submit">
            {tNav("logout")}
          </Button>
        </form>
      </div>

      {!onboardingComplete && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>Completa tu perfil</CardTitle>
            <CardDescription>
              Necesitamos algunos datos antes de que puedas iniciar un caso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/onboarding">Continuar onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {verificationStatus && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{tIdentity("statusLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                  residencyApproved
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {tIdentity(`statuses.${verificationStatus as "submitted"}`)}
              </span>
            </p>
            {verificationStatus === "rejected" && rejectionReason && (
              <p className="text-destructive">
                {tIdentity("rejectedNotice", { reason: rejectionReason })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {locale === "es" ? "Mis casos activos" : "My active cases"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeCases.length === 0
                ? locale === "es"
                  ? "Aún no tienes casos. Inicia uno para comenzar."
                  : "No active cases yet. Start one to begin."
                : locale === "es"
                  ? `${activeCases.length} caso(s) en curso.`
                  : `${activeCases.length} case(s) in progress.`}
            </p>
          </div>
          <Button asChild disabled={!onboardingComplete || !residencyApproved}>
            <Link href="/services">
              {locale === "es" ? "+ Iniciar nuevo caso" : "+ Start new case"}
            </Link>
          </Button>
        </header>

        {activeCases.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("emptyState")}</CardTitle>
              <CardDescription>
                Explora los servicios disponibles para empezar tu primer trámite.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild>
                <Link href="/services">Ver servicios</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activeCases.map((c) => (
              <CaseListCard key={c.id} caseRow={c} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {archivedCases.length > 0 ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            {locale === "es" ? "Casos archivados/cancelados" : "Archived/cancelled cases"} (
            {archivedCases.length})
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {archivedCases.map((c) => (
              <CaseListCard key={c.id} caseRow={c} locale={locale} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}
