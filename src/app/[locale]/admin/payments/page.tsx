import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentActionsForm } from "@/features/admin/components/payment-actions-form"
import { fetchPendingPayments } from "@/features/payments/repository"
import type { Locale } from "@/lib/i18n/routing"
import { createServiceClient } from "@/lib/supabase/server"
import { Money } from "@/shared/domain/money"

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const pending = await fetchPendingPayments()

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
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Pagos pendientes</h1>
      {enriched.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No hay pagos pendientes de verificar.
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {enriched.map((p) => (
          <Card key={p.id}>
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
                  <dd className="font-medium">{Money.fromCents(p.amount_cents).format(locale)}</dd>
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
    </section>
  )
}
