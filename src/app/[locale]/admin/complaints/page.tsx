import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComplaintRowActions } from "@/features/admin/components/complaint-row-actions"
import { fetchComplaintsAdmin } from "@/features/complaints/repository"
import type { Locale } from "@/lib/i18n/routing"

const STATUS_LABEL: Record<string, string> = {
  open: "Abierta",
  investigating: "Investigando",
  resolved: "Resuelta",
  escalated: "Escalada",
}

const CATEGORY_LABEL: Record<string, string> = {
  inaccurate_result: "Resultado inexacto",
  failed_exercise_rights: "Derechos no ejercidos",
  unnecessary_service: "Servicio innecesario",
  billing: "Facturación",
  technical: "Técnico",
  other: "Otro",
}

export default async function AdminComplaintsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)
  const complaints = await fetchComplaintsAdmin()

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Quejas</h1>
      {complaints.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No hay quejas registradas.
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {complaints.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {c.complaint_number} — {c.subject}
                </CardTitle>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.reporter_email} · {CATEGORY_LABEL[c.category]} ·{" "}
                {new Date(c.created_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-sm">{c.description}</p>
              {c.resolution && (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                  <strong>Resolución:</strong> {c.resolution}
                </p>
              )}
              {(c.status === "open" || c.status === "investigating") && (
                <ComplaintRowActions complaintId={c.id} />
              )}
              {c.reported_to_innovation_office && (
                <p className="text-xs italic text-muted-foreground">
                  Reportado al Innovation Office:{" "}
                  {c.reported_to_innovation_office_at
                    ? new Date(c.reported_to_innovation_office_at).toLocaleDateString()
                    : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
