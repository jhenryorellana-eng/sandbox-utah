import { UserRound } from "lucide-react"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/features/admin/guard"
import type { CaseWithService } from "@/features/cases/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServiceClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

const STATUS_LABEL: Record<string, string> = {
  created: "Creado",
  contract_pending: "Contrato pendiente",
  contract_signed: "Firmado",
  payment_pending: "Pago pendiente",
  in_progress: "En progreso",
  review_pending: "En revisión",
  needs_correction: "Necesita correcciones",
  approved: "Aprobado",
  finalized: "Finalizado",
  archived: "Archivado",
  cancelled: "Cancelado",
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>
}) {
  const { locale: rawLocale, clientId } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  await requireAdmin(locale)

  const service = createServiceClient()
  const [{ data: profile }, { data: cases }, { data: identity }] = await Promise.all([
    service
      .from("profiles")
      .select(
        "id, full_name, email, phone, preferred_language, utah_residency_verified, created_at",
      )
      .eq("id", clientId)
      .maybeSingle(),
    service
      .from("cases")
      .select(
        "*, service:services(slug, name_es, name_en, workflow_slug, base_price_cents, allows_multiple_beneficiaries, pdf_template_path), tier:service_tiers(id, beneficiaries_count, price_cents, label_es, label_en)",
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    service
      .from("identity_verifications")
      .select("status, created_at")
      .eq("user_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!profile) notFound()

  const casesList = (cases ?? []) as unknown as CaseWithService[]
  const activeCases = casesList.filter(
    (c) => c.intake_status !== "archived" && c.intake_status !== "cancelled",
  )
  const archivedCases = casesList.filter(
    (c) => c.intake_status === "archived" || c.intake_status === "cancelled",
  )

  return (
    <section className="space-y-6">
      <header className="glass-panel rounded-lg p-5 sm:p-6">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          <UserRound className="size-3.5" aria-hidden />
          Cliente
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal">
          {profile.full_name ?? profile.email}
        </h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          {profile.email} {profile.phone ? `· ${profile.phone}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Residencia Utah: {profile.utah_residency_verified ? "verificada" : "no verificada"} ·
          Identidad: {identity?.status ?? "no enviada"} · Idioma: {profile.preferred_language}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Casos activos ({activeCases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin casos activos.</p>
          ) : (
            <ul className="space-y-2">
              {activeCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/cases/${c.id}` as never}
                    className="block rounded-md border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono uppercase text-muted-foreground">
                          {c.case_number}
                        </p>
                        <p className="font-semibold">{c.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {locale === "es" ? c.service.name_es : c.service.name_en}
                          {c.tier
                            ? ` · ${locale === "es" ? c.tier.label_es : c.tier.label_en}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-medium">
                          {c.agreed_price_cents
                            ? Money.fromCents(c.agreed_price_cents).format(locale)
                            : "—"}
                        </p>
                        <p className="text-muted-foreground">
                          {STATUS_LABEL[c.intake_status] ?? c.intake_status}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {archivedCases.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Archivados / cancelados ({archivedCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {archivedCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/cases/${c.id}` as never}
                    className="text-primary hover:underline"
                  >
                    {c.case_number} — {c.display_name}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    ({STATUS_LABEL[c.intake_status] ?? c.intake_status})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
