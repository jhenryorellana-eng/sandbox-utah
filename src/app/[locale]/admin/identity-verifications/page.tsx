import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IdentityActionsForm } from "@/features/admin/components/identity-actions-form"
import { fetchPendingVerifications, signedDocumentUrl } from "@/features/identity/repository"
import type { Locale } from "@/lib/i18n/routing"

export default async function AdminIdentityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const pending = await fetchPendingVerifications()

  // Generar signed URLs en paralelo (server-side, expira 15 min)
  const withUrls = await Promise.all(
    pending.map(async (v) => ({
      ...v,
      frontUrl: v.document_front_path ? await signedDocumentUrl(v.document_front_path) : null,
      backUrl: v.document_back_path ? await signedDocumentUrl(v.document_back_path) : null,
      proofUrl: v.document_proof_path ? await signedDocumentUrl(v.document_proof_path) : null,
    })),
  )

  return <Queue items={withUrls} />
}

function Queue({
  items,
}: {
  items: Array<{
    id: string
    profile: { email: string; full_name: string | null }
    created_at: string
    frontUrl: string | null
    backUrl: string | null
    proofUrl: string | null
  }>
}) {
  const t = useTranslations("Admin.identity")
  if (items.length === 0) {
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noPending")}
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("queueLabel")}</p>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {item.profile.full_name ?? item.profile.email}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{item.profile.email}</p>
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(item.created_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <DocLink label="Front" url={item.frontUrl} />
                <DocLink label="Back" url={item.backUrl} />
                <DocLink label="Proof" url={item.proofUrl} />
              </div>
              <IdentityActionsForm verificationId={item.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return <span className="text-xs text-muted-foreground">{label}: —</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
    >
      {label} ↗
    </a>
  )
}
