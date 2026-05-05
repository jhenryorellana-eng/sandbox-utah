import { redirect } from "next/navigation"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signOutAction } from "@/features/auth/actions/sign-out"
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
}: {
  locale: Locale
  displayName: string
  onboardingComplete: boolean
  residencyApproved: boolean
  verificationStatus: string | null
  rejectionReason: string | null
}) {
  const t = useTranslations("Dashboard")
  const tNav = useTranslations("Nav")
  const tIdentity = useTranslations("Identity")

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
          <Button variant="outline" disabled>
            {t("createFirstCase")}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
