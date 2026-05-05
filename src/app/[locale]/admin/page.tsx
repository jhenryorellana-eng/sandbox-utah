import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
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
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t("kpis.activeUsers")} value={activeUsers} />
        <Kpi label={t("kpis.pendingIdentity")} value={pendingIdentity} />
        <Kpi label={t("kpis.openComplaints")} value={0} />
      </div>
      <p className="text-sm italic text-muted-foreground">{t("comingSoon")}</p>
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
