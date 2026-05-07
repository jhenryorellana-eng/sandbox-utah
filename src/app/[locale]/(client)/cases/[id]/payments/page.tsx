import { CreditCard } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CaseShell } from "@/features/cases/components/case-shell"
import { fetchCaseById } from "@/features/cases/repository"
import { ReportPaymentForm } from "@/features/payments/components/report-payment-form"
import { fetchPaymentsForCase, fetchPlanForCase } from "@/features/payments/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

export default async function CasePaymentsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: rawLocale, id } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const caseRow = await fetchCaseById(id, user.id)
  if (!caseRow) notFound()

  const [plan, payments] = await Promise.all([
    fetchPlanForCase(id, user.id),
    fetchPaymentsForCase(id, user.id),
  ])

  const totalPaid = payments
    .filter((p) => p.status === "verified")
    .reduce((acc, p) => acc + p.amount_cents, 0)
  const totalDue = plan?.total_amount_cents ?? caseRow.agreed_price_cents ?? 0
  const balance = Math.max(0, totalDue - totalPaid)

  const reportable =
    plan?.installments.filter((i) => i.status === "pending" || i.status === "overdue") ?? []

  return (
    <CaseShell caseRow={caseRow} locale={locale} currentTab="payments">
      {!plan && (
        <Card className="lift-card">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Aun no se ha definido un plan de pagos. Tu admin lo creara cuando avance el caso.
          </CardContent>
        </Card>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Total" value={Money.fromCents(totalDue).format(locale)} />
            <Kpi label="Pagado" value={Money.fromCents(totalPaid).format(locale)} />
            <Kpi label="Saldo" value={Money.fromCents(balance).format(locale)} />
          </div>

          <Card className="lift-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-5 text-primary" aria-hidden />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/70">
                {plan.installments.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      <span className="font-black">
                        {i.installment_number === 0 ? "Enganche" : `Cuota ${i.installment_number}`}
                      </span>{" "}
                      <span className="text-muted-foreground">/ {i.due_date}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-black">
                        {Money.fromCents(i.amount_cents).format(locale)}
                      </span>
                      <StatusBadge status={i.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lift-card">
            <CardHeader>
              <CardTitle className="text-base">Reportar nuevo pago</CardTitle>
              <CardDescription>
                Metodos aceptados: efectivo, Zelle, transferencia, cheque, money order, Cash App,
                Venmo. Sube siempre el comprobante.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportPaymentForm
                installments={reportable.map((i) => ({
                  id: i.id,
                  installmentNumber: i.installment_number,
                  amountCents: i.amount_cents,
                }))}
              />
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card className="lift-card">
              <CardHeader>
                <CardTitle className="text-base">Pagos reportados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/70">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>
                        {p.payment_date} / {p.payment_method}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-black">
                          {Money.fromCents(p.amount_cents).format(locale)}
                        </span>
                        <StatusBadge status={p.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </CaseShell>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="lift-card">
      <CardHeader>
        <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black tabular-nums">{value}</p>
      </CardContent>
    </Card>
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
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-black ${palette[status] ?? "bg-secondary"}`}
    >
      {status}
    </span>
  )
}
