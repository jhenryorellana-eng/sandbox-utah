import { BadgeDollarSign } from "lucide-react"
import { setRequestLocale } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentActionsForm } from "@/features/admin/components/payment-actions-form"
import { fetchPendingPayments } from "@/features/payments/repository"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"
import { createServiceClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

interface CaseWithoutPlan {
  id: string
  case_number: string
  display_name: string
  intake_status: string
  agreed_price_cents: number | null
  client_name: string | null
  client_email: string
}

async function fetchCasesAwaitingPlan(): Promise<CaseWithoutPlan[]> {
  const service = createServiceClient()
  const { data: casesWithPlan } = await service.from("payment_plans").select("case_id")
  const planCaseIds = new Set((casesWithPlan ?? []).map((r) => r.case_id))

  const { data: cases } = await service
    .from("cases")
    .select(
      "id, case_number, display_name, intake_status, agreed_price_cents, client_id, client:profiles!cases_client_id_fkey(full_name, email)",
    )
    .in("intake_status", ["contract_signed", "contract_pending", "payment_pending"])
    .order("created_at", { ascending: false })

  return (cases ?? [])
    .filter((c) => !planCaseIds.has(c.id))
    .map((c) => {
      const client = (c.client ?? {}) as { full_name?: string | null; email?: string }
      return {
        id: c.id,
        case_number: c.case_number,
        display_name: c.display_name,
        intake_status: c.intake_status,
        agreed_price_cents: c.agreed_price_cents,
        client_name: client.full_name ?? null,
        client_email: client.email ?? "—",
      }
    })
}

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const [pending, awaitingPlan] = await Promise.all([
    fetchPendingPayments(),
    fetchCasesAwaitingPlan(),
  ])

  // Signed URLs para los comprobantes (15 min)
  const service = createServiceClient()
  const enriched = await Promise.all(
    pending.map(async (p) => {
      const { data: proofs } = await service
        .from("payment_proofs")
        .select("storage_path, filename")
        .eq("payment_id", p.id)
      const proof = proofs?.[0]
      let proofUrl: string | null = null
      if (proof) {
        const { data: signed } = await service.storage
          .from("payment-proofs")
          .createSignedUrl(proof.storage_path, 60 * 15)
        proofUrl = signed?.signedUrl ?? null
      }
      return { ...p, proofUrl, proofFilename: proof?.filename ?? null }
    }),
  )

  return (
    <section className="space-y-8">
      <div className="glass-panel rounded-lg p-5 sm:p-6">
        <p className="brand-kicker">
          <BadgeDollarSign className="size-3.5" aria-hidden />
          Finanzas
        </p>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal">Pagos</h1>
      </div>

      {/* Casos esperando plan */}
      <div className="space-y-3">
        <h2 className="text-xl font-black">Casos esperando plan de pagos</h2>
        {awaitingPlan.length === 0 && (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              No hay casos pendientes de crearles plan.
            </CardContent>
          </Card>
        )}
        {awaitingPlan.map((c) => (
          <Card key={c.id} className="lift-card">
            <CardHeader>
              <CardTitle className="text-base">{c.display_name}</CardTitle>
              <CardDescription>
                {c.case_number} · {c.client_name ?? c.client_email} · estado: {c.intake_status}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Precio acordado:{" "}
                <span className="font-medium text-foreground">
                  {c.agreed_price_cents
                    ? Money.fromCents(c.agreed_price_cents).format(locale)
                    : "—"}
                </span>
              </p>
              <Button asChild>
                <Link href={`/admin/cases/${c.id}`}>Crear plan →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagos por verificar */}
      <div className="space-y-3">
        <h2 className="text-xl font-black">Pagos por verificar</h2>
        {enriched.length === 0 && (
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">
              No hay pagos pendientes de verificar.
            </CardContent>
          </Card>
        )}
        <div className="space-y-4">
          {enriched.map((p) => (
            <Card key={p.id} className="lift-card">
              <CardHeader>
                <CardTitle className="text-base">{p.client.full_name ?? p.client.email}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.client.email}</p>
                <p className="text-xs text-muted-foreground">
                  Reportado: {new Date(p.reported_at).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <dl className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Monto</dt>
                    <dd className="font-medium">
                      {Money.fromCents(p.amount_cents).format(locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Método</dt>
                    <dd className="font-medium">{p.payment_method}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Fecha del pago</dt>
                    <dd className="font-medium">{p.payment_date}</dd>
                  </div>
                </dl>
                {p.payment_method_details && (
                  <p className="rounded-md bg-secondary/30 p-2 text-xs">
                    Detalles: {p.payment_method_details}
                  </p>
                )}
                {p.proofUrl && (
                  <a
                    href={p.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
                  >
                    Ver comprobante ({p.proofFilename}) ↗
                  </a>
                )}
                <PaymentActionsForm paymentId={p.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
