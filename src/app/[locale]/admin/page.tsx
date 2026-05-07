import { Activity, ShieldCheck, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import type { ComponentType } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const [{ count: activeUsers }, { count: pendingIdentity }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("identity_verifications")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "pending_admin"]),
  ])

  return <Dashboard activeUsers={activeUsers ?? 0} pendingIdentity={pendingIdentity ?? 0} />
}

function Dashboard({
  activeUsers,
  pendingIdentity,
}: {
  activeUsers: number
  pendingIdentity: number
}) {
  const t = useTranslations("Admin.dashboard")
  return (
    <section className="space-y-6">
      <header className="glass-panel rounded-lg p-5 sm:p-6">
        <p className="brand-kicker">Admin console</p>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Operacion diaria: identidad, pagos, catalogo y reportes del Utah Sandbox.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={UsersRound} label={t("kpis.activeUsers")} value={activeUsers} />
        <Kpi icon={ShieldCheck} label={t("kpis.pendingIdentity")} value={pendingIdentity} />
        <Kpi icon={Activity} label={t("kpis.openComplaints")} value={0} />
      </div>
      <p className="rounded-lg border border-border/70 bg-white/70 p-4 text-sm text-muted-foreground backdrop-blur-xl">
        {t("comingSoon")}
      </p>
    </section>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <Card className="lift-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-black text-muted-foreground">
          <Icon className="size-4 text-primary" aria-hidden />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-black tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
