import { notFound, redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {caseRow.case_number}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Mis pagos</h1>
      <p className="text-muted-foreground">{caseRow.display_name}</p>

      {!plan && (
        <Card className="mt-6">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Aún no se ha definido un plan de pagos. Tu admin lo creará cuando avance el caso.
          </CardContent>
        </Card>
      )}

      {plan && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Kpi label="Total" value={Money.fromCents(totalDue).format(locale)} />
            <Kpi label="Pagado" value={Money.fromCents(totalPaid).format(locale)} />
            <Kpi label="Saldo" value={Money.fromCents(balance).format(locale)} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {plan.installments.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="font-medium">
                        {i.installment_number === 0 ? "Enganche" : `Cuota ${i.installment_number}`}
                      </span>{" "}
                      <span className="text-muted-foreground">· {i.due_date}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span>{Money.fromCents(i.amount_cents).format(locale)}</span>
                      <StatusBadge status={i.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Reportar nuevo pago</CardTitle>
              <CardDescription>
                Métodos aceptados: efectivo, Zelle, transferencia, cheque, money order, Cash App,
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Pagos reportados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {payments.map((p) => (
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
        </>
      )}
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
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
    <span className={`rounded-full px-2 py-0.5 text-xs ${palette[status] ?? "bg-secondary"}`}>
      {status}
    </span>
  )
}
