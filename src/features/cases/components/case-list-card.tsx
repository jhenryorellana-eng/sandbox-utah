import { ArrowRight, FileText } from "lucide-react"
import { Link } from "@/lib/i18n/navigation"
import { Money } from "@/shared/domain/money"
import type { CaseWithService } from "../repository"

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  created: { es: "Creado", en: "Created" },
  contract_pending: { es: "Contrato pendiente de firma", en: "Contract pending signature" },
  contract_signed: {
    es: "Contrato firmado, esperando pago",
    en: "Contract signed, awaiting payment",
  },
  payment_pending: { es: "Pago pendiente", en: "Payment pending" },
  in_progress: { es: "En progreso", en: "In progress" },
  review_pending: { es: "En revision QA", en: "Under QA review" },
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
    es: "Esperando plan de pagos",
    en: "Waiting for payment plan",
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
    es: "En revision por el equipo",
    en: "Under team review",
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
        ? `${caseRow.beneficiary_count} ${
            caseRow.beneficiary_count === 1 ? "beneficiario" : "beneficiarios"
          }`
        : `${caseRow.beneficiary_count} ${
            caseRow.beneficiary_count === 1 ? "beneficiary" : "beneficiaries"
          }`
      : null

  return (
    <Link
      href={`/cases/${caseRow.id}` as never}
      className="group lift-card block rounded-lg border border-white/70 bg-white/78 p-4 shadow-[0_16px_42px_oklch(0.2_0.047_255_/_8%)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" aria-hidden />
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-black text-secondary-foreground">
          {statusLabel}
        </span>
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {caseRow.case_number}
      </p>
      <h3 className="mt-1 text-lg font-black leading-tight tracking-normal text-foreground">
        {caseRow.display_name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {serviceName}
        {tierLabel ? ` / ${tierLabel}` : ""}
        {beneficiaryHint ? ` / ${beneficiaryHint}` : ""}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
        <p className="text-lg font-black text-primary">
          {caseRow.agreed_price_cents
            ? Money.fromCents(caseRow.agreed_price_cents).format(locale)
            : "-"}
        </p>
        {next ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-primary">
            {next[locale]}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </Link>
  )
}
