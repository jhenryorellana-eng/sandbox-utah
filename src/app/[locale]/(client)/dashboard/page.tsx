import { Clock3, LogOut, Plus, ShieldCheck } from "lucide-react"
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
  const canStartCase = onboardingComplete && residencyApproved

  return (
    <section className="page-shell flex-1">
      <div className="glass-panel mb-8 rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="brand-kicker">
              <ShieldCheck className="size-3.5" aria-hidden />
              {residencyApproved
                ? locale === "es"
                  ? "Residencia verificada"
                  : "Residency verified"
                : locale === "es"
                  ? "Verificacion pendiente"
                  : "Verification pending"}
            </p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              {t("welcome", { name: displayName || (locale === "es" ? "Cliente" : "Client") })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {locale === "es"
                ? "Tu espacio para seguir casos, documentos, pagos y formularios oficiales."
                : "Your workspace for cases, documents, payments, and official forms."}
            </p>
          </div>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button variant="outline" type="submit">
              <LogOut className="size-4" aria-hidden />
              {tNav("logout")}
            </Button>
          </form>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatusTile
          label={locale === "es" ? "Casos activos" : "Active cases"}
          value={activeCases.length.toString()}
        />
        <StatusTile
          label={locale === "es" ? "Archivados" : "Archived"}
          value={archivedCases.length.toString()}
        />
        <StatusTile
          label={locale === "es" ? "Estado" : "Status"}
          value={residencyApproved ? (locale === "es" ? "Listo" : "Ready") : "Hold"}
        />
      </div>

      {!onboardingComplete && (
        <Card className="mb-6 lift-card">
          <CardHeader>
            <CardTitle>
              {locale === "es" ? "Completa tu perfil" : "Complete your profile"}
            </CardTitle>
            <CardDescription>
              {locale === "es"
                ? "Necesitamos tus datos basicos antes de iniciar un caso."
                : "We need your basic information before you start a case."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/onboarding">{locale === "es" ? "Continuar" : "Continue"}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {verificationStatus && (
        <Card className="mb-6 lift-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-primary" aria-hidden />
              {tIdentity("statusLabel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                residencyApproved
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {tIdentity(`statuses.${verificationStatus as "submitted"}`)}
            </span>
            {verificationStatus === "rejected" && rejectionReason && (
              <p className="text-destructive">
                {tIdentity("rejectedNotice", { reason: rejectionReason })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-normal">
              {locale === "es" ? "Mis casos activos" : "My active cases"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCases.length === 0
                ? locale === "es"
                  ? "Aun no tienes casos. Inicia uno para comenzar."
                  : "No active cases yet. Start one to begin."
                : locale === "es"
                  ? `${activeCases.length} caso(s) en curso.`
                  : `${activeCases.length} case(s) in progress.`}
            </p>
          </div>
          {canStartCase ? (
            <Button asChild>
              <Link href="/services">
                <Plus className="size-4" aria-hidden />
                {locale === "es" ? "Iniciar nuevo caso" : "Start new case"}
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <Clock3 className="size-4" aria-hidden />
              {locale === "es" ? "Verificacion requerida" : "Verification required"}
            </Button>
          )}
        </div>

        {activeCases.length === 0 ? (
          <Card className="lift-card">
            <CardHeader>
              <CardTitle>{t("emptyState")}</CardTitle>
              <CardDescription>
                {locale === "es"
                  ? "Explora los servicios disponibles para empezar tu primer tramite."
                  : "Explore the available services to start your first filing."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/services">{locale === "es" ? "Ver servicios" : "View services"}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeCases.map((c) => (
              <CaseListCard key={c.id} caseRow={c} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {archivedCases.length > 0 ? (
        <details className="mt-8 rounded-lg border border-white/70 bg-white/70 p-4 backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-black text-muted-foreground">
            {locale === "es" ? "Casos archivados/cancelados" : "Archived/cancelled cases"} (
            {archivedCases.length})
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {archivedCases.map((c) => (
              <CaseListCard key={c.id} caseRow={c} locale={locale} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  )
}
