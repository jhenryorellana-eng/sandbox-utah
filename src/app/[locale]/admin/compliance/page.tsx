import { FileSearch } from "lucide-react"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchComplianceMetrics } from "@/features/complaints/repository"
import type { Locale } from "@/lib/i18n/routing"

const CATEGORY_LABEL: Record<string, string> = {
  inaccurate_result: "Resultado inexacto",
  failed_exercise_rights: "Derechos no ejercidos",
  unnecessary_service: "Servicio innecesario",
  billing: "Facturación",
  technical: "Técnico",
  other: "Otro",
}

export default async function AdminCompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const metrics = await fetchComplianceMetrics(monthStart.toISOString(), nextMonth.toISOString())

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-lg p-5 sm:p-6">
        <p className="brand-kicker">
          <FileSearch className="size-3.5" aria-hidden />
          Utah Sandbox
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">
          Compliance — Sandbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Métricas del mes en curso. El reporte oficial al Innovation Office se prepara mensualmente
          con CSV/PDF.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Servicios prestados" value={metrics.servicesProvided.toString()} />
        <Kpi label="Clientes únicos" value={metrics.uniqueClients.toString()} />
        <Kpi
          label="Quejas totales"
          value={metrics.totalComplaints.toString()}
          subline={
            metrics.complaintRatio ? `Ratio 1 : ${metrics.complaintRatio} (target ≥ 1:4000)` : "—"
          }
        />
        <Kpi label="IA — total" value={metrics.aiInteractions.toString()} />
        <Kpi label="IA — bloqueadas" value={metrics.aiBlocked.toString()} />
        <Kpi label="IA — flagged" value={metrics.aiFlagged.toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Quejas por categoría (Consumer Harm Framework)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(metrics.complaintsByCategory).map(([cat, count]) => (
              <li key={cat} className="flex justify-between">
                <span>{CATEGORY_LABEL[cat] ?? cat}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quejas por status</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(metrics.complaintsByStatus).map(([s, count]) => (
              <li key={s} className="flex justify-between">
                <span>{s}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos pasos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Generar reporte CSV/PDF mensual desde audit_log + complaints + ai_interactions.</p>
          <p>• Enviar al Innovation Office antes del día 5 del mes siguiente.</p>
          <p>• Mock audit interno trimestral simulando consultas del auditor externo.</p>
        </CardContent>
      </Card>
    </section>
  )
}

function Kpi({ label, value, subline }: { label: string; value: string; subline?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black tabular-nums">{value}</p>
        {subline && <p className="mt-1 text-xs text-muted-foreground">{subline}</p>}
      </CardContent>
    </Card>
  )
}
