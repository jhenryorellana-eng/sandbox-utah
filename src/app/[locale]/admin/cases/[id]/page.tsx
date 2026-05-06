import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentActionsForm } from "@/features/admin/components/payment-actions-form"
import { requireAdmin } from "@/features/admin/guard"
import { fetchCaseAdmin } from "@/features/cases/repository"
import { CreatePlanForm } from "@/features/payments/components/create-plan-form"
import { fetchPaymentsForCase, fetchPlanForCase } from "@/features/payments/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServiceClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

const STATUS_LABEL: Record<string, string> = {
  created: "Creado",
  contract_pending: "Contrato pendiente de firma",
  contract_signed: "Contrato firmado — esperando plan de pagos",
  payment_pending: "Plan creado — esperando pago",
  in_progress: "En progreso",
  review_pending: "En revisión QA",
  needs_correction: "Necesita correcciones",
  approved: "Aprobado",
  finalized: "Finalizado",
  archived: "Archivado",
  cancelled: "Cancelado",
}

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: rawLocale, id } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  await requireAdmin(locale)

  const caseRow = await fetchCaseAdmin(id)
  if (!caseRow) notFound()

  // Plan + payments + cliente + contrato (vía service-role, admin ya validado)
  const service = createServiceClient()
  const [{ data: client }, { data: contract }, plan, payments] = await Promise.all([
    service
      .from("profiles")
      .select("full_name, email, preferred_language")
      .eq("id", caseRow.client_id)
      .maybeSingle(),
    service
      .from("contracts")
      .select("id, signature_status, signed_at")
      .eq("case_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchPlanForCase(id, caseRow.client_id),
    fetchPaymentsForCase(id, caseRow.client_id),
  ])

  const totalPaid = payments
    .filter((p) => p.status === "verified")
    .reduce((acc, p) => acc + p.amount_cents, 0)
  const totalDue = plan?.total_amount_cents ?? caseRow.agreed_price_cents ?? 0
  const balance = Math.max(0, totalDue - totalPaid)
  const reportedNotVerified = payments.filter((p) => p.status === "reported")

  const serviceName = locale === "es" ? caseRow.service.name_es : caseRow.service.name_en

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {caseRow.case_number}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{caseRow.display_name}</h1>
        <p className="text-sm text-muted-foreground">{serviceName}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {STATUS_LABEL[caseRow.intake_status] ?? caseRow.intake_status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{client?.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{client?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Precio acordado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {caseRow.agreed_price_cents
                ? Money.fromCents(caseRow.agreed_price_cents).format(locale)
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contrato</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {contract ? (
            <p>
              <span className="font-medium">Estado:</span> {contract.signature_status}
              {contract.signed_at && (
                <span className="text-muted-foreground">
                  {" "}
                  · firmado {new Date(contract.signed_at).toLocaleDateString()}
                </span>
              )}
            </p>
          ) : (
            <p className="italic text-muted-foreground">Sin contrato.</p>
          )}
        </CardContent>
      </Card>

      {/* Plan de pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan de pagos</CardTitle>
          <CardDescription>
            {plan
              ? "Plan ya creado. Para regenerar, cancela el caso e inicia uno nuevo."
              : "Crea el plan que el cliente debe pagar antes de avanzar a in_progress."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan && (
            <>
              <dl className="grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Total</dt>
                  <dd className="font-medium">{Money.fromCents(totalDue).format(locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Pagado</dt>
                  <dd className="font-medium">{Money.fromCents(totalPaid).format(locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Saldo</dt>
                  <dd className="font-medium">{Money.fromCents(balance).format(locale)}</dd>
                </div>
              </dl>
              <ul className="divide-y divide-border rounded-md border border-border">
                {plan.installments.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      {i.installment_number === 0 ? "Enganche" : `Cuota ${i.installment_number}`}
                      <span className="ml-2 text-xs text-muted-foreground">{i.due_date}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span>{Money.fromCents(i.amount_cents).format(locale)}</span>
                      <StatusBadge status={i.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!plan && caseRow.agreed_price_cents != null && (
            <CreatePlanForm
              caseId={caseRow.id}
              agreedPriceCents={caseRow.agreed_price_cents}
              locale={locale}
            />
          )}
          {!plan && caseRow.agreed_price_cents == null && (
            <p className="text-sm italic text-muted-foreground">
              El servicio no tiene precio acordado. Edita el catálogo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pagos pendientes de verificación */}
      {reportedNotVerified.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagos por verificar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportedNotVerified.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    <span className="font-medium">
                      {Money.fromCents(p.amount_cents).format(locale)}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {p.payment_method} · {p.payment_date}
                    </span>
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                {p.payment_method_details && (
                  <p className="mt-2 text-xs text-muted-foreground">{p.payment_method_details}</p>
                )}
                <div className="mt-3">
                  <PaymentActionsForm paymentId={p.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagos verificados / rechazados */}
      {payments.length > reportedNotVerified.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {payments
                .filter((p) => p.status !== "reported")
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {p.payment_date} · {p.payment_method}
                    </span>
                    <span className="flex items-center gap-3">
                      <span>{Money.fromCents(p.amount_cents).format(locale)}</span>
                      <StatusBadge status={p.status} />
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    pending: "bg-secondary text-secondary-foreground",
    overdue: "bg-amber-100 text-amber-900",
    reported: "bg-blue-100 text-blue-900",
    verified: "bg-emerald-100 text-emerald-900",
    rejected: "bg-rose-100 text-rose-900",
    refunded: "bg-zinc-100 text-zinc-900",
    waived: "bg-zinc-100 text-zinc-900",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${palette[status] ?? "bg-secondary"}`}>
      {status}
    </span>
  )
}
