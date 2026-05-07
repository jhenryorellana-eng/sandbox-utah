import { Link } from "@/lib/i18n/navigation"
import { Money } from "@/shared/domain/money"
import type { CaseWithService } from "../repository"

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  created: { es: "Creado", en: "Created" },
  contract_pending: { es: "Contrato pendiente de firma", en: "Contract pending signature" },
  contract_signed: {
    es: "Contrato firmado · esperando pago",
    en: "Contract signed · awaiting payment",
  },
  payment_pending: { es: "Pago pendiente", en: "Payment pending" },
  in_progress: { es: "En progreso", en: "In progress" },
  review_pending: { es: "En revisión QA", en: "Under QA review" },
  needs_correction: { es: "Necesita correcciones", en: "Needs corrections" },
  approved: { es: "Aprobado", en: "Approved" },
  finalized: { es: "Finalizado", en: "Finalized" },
  archived: { es: "Archivado", en: "Archived" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
}

const NEXT_ACTION: Record<string, { es: string; en: string; href: (id: string) => string }> = {
  created: {
    es: "Firmar contrato",
    en: "Sign contract",
    href: (id) => `/cases/${id}/contract`,
  },
  contract_pending: {
    es: "Firmar contrato",
    en: "Sign contract",
    href: (id) => `/cases/${id}/contract`,
  },
  contract_signed: {
    es: "Esperando que admin cree plan de pagos",
    en: "Waiting for admin to create payment plan",
    href: (id) => `/cases/${id}/payments`,
  },
  payment_pending: {
    es: "Reportar pago",
    en: "Report payment",
    href: (id) => `/cases/${id}/payments`,
  },
  in_progress: {
    es: "Continuar",
    en: "Continue",
    href: (id) => `/cases/${id}`,
  },
  needs_correction: {
    es: "Aplicar correcciones",
    en: "Apply corrections",
    href: (id) => `/cases/${id}`,
  },
  review_pending: {
    es: "En revisión por nuestro equipo",
    en: "Under review by our team",
    href: (id) => `/cases/${id}`,
  },
  approved: {
    es: "Revisar PDF final",
    en: "Review final PDF",
    href: (id) => `/cases/${id}/review`,
  },
  finalized: {
    es: "Ver instrucciones de filing",
    en: "View filing instructions",
    href: (id) => `/cases/${id}/finalize`,
  },
}

interface CaseListCardProps {
  caseRow: CaseWithService
  locale: "es" | "en"
}

export function CaseListCard({ caseRow, locale }: CaseListCardProps) {
  const serviceName = locale === "es" ? caseRow.service.name_es : caseRow.service.name_en
  const tierLabel = caseRow.tier
    ? locale === "es"
      ? caseRow.tier.label_es
      : caseRow.tier.label_en
    : null
  const statusLabel = STATUS_LABELS[caseRow.intake_status]?.[locale] ?? caseRow.intake_status
  const next = NEXT_ACTION[caseRow.intake_status]
  const beneficiaryHint =
    caseRow.beneficiary_count && caseRow.beneficiary_count > 0
      ? locale === "es"
        ? `${caseRow.beneficiary_count} ${caseRow.beneficiary_count === 1 ? "beneficiario" : "beneficiarios"}`
        : `${caseRow.beneficiary_count} ${caseRow.beneficiary_count === 1 ? "beneficiary" : "beneficiaries"}`
      : null

  return (
    <Link
      href={`/cases/${caseRow.id}` as never}
      className="block rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {caseRow.case_number}
          </p>
          <h3 className="mt-0.5 text-base font-semibold">{caseRow.display_name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {serviceName}
            {tierLabel ? ` · ${tierLabel}` : ""}
            {beneficiaryHint ? ` · ${beneficiaryHint}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold">
            {caseRow.agreed_price_cents
              ? Money.fromCents(caseRow.agreed_price_cents).format(locale)
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>
      </div>
      {next ? <p className="mt-3 text-sm font-medium text-primary">→ {next[locale]}</p> : null}
    </Link>
  )
}
