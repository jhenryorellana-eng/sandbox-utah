import { Money } from "@/shared/domain/money"
import type { CaseWithService } from "../repository"
import { type CaseTabKey, CaseTabsNav } from "./case-tabs-nav"

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  created: { es: "Creado", en: "Created" },
  contract_pending: { es: "Contrato pendiente", en: "Contract pending" },
  contract_signed: { es: "Contrato firmado", en: "Contract signed" },
  payment_pending: { es: "Pago pendiente", en: "Payment pending" },
  in_progress: { es: "En progreso", en: "In progress" },
  review_pending: { es: "En revisión", en: "Under review" },
  needs_correction: { es: "Necesita correcciones", en: "Needs correction" },
  approved: { es: "Aprobado", en: "Approved" },
  finalized: { es: "Finalizado", en: "Finalized" },
  archived: { es: "Archivado", en: "Archived" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
}

const STATUS_TONE: Record<string, string> = {
  created: "bg-muted text-foreground",
  contract_pending: "bg-amber-100 text-amber-900",
  contract_signed: "bg-blue-100 text-blue-900",
  payment_pending: "bg-amber-100 text-amber-900",
  in_progress: "bg-blue-100 text-blue-900",
  review_pending: "bg-violet-100 text-violet-900",
  needs_correction: "bg-rose-100 text-rose-900",
  approved: "bg-emerald-100 text-emerald-900",
  finalized: "bg-emerald-200 text-emerald-900",
  archived: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
}

interface CaseShellProps {
  caseRow: CaseWithService
  locale: "es" | "en"
  currentTab: CaseTabKey
  children: React.ReactNode
}

export function CaseShell({ caseRow, locale, currentTab, children }: CaseShellProps) {
  const serviceName = locale === "es" ? caseRow.service.name_es : caseRow.service.name_en
  const tierLabel = caseRow.tier
    ? locale === "es"
      ? caseRow.tier.label_es
      : caseRow.tier.label_en
    : null
  const statusKey = caseRow.intake_status
  const statusLabel = STATUS_LABELS[statusKey]?.[locale] ?? statusKey
  const statusTone = STATUS_TONE[statusKey] ?? "bg-muted"

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <header className="mb-4 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {caseRow.case_number}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{caseRow.display_name}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{serviceName}</span>
          {tierLabel ? <span aria-hidden>·</span> : null}
          {tierLabel ? <span>{tierLabel}</span> : null}
          <span aria-hidden>·</span>
          <span>
            {caseRow.agreed_price_cents
              ? Money.fromCents(caseRow.agreed_price_cents).format(locale)
              : "—"}
          </span>
          <span aria-hidden>·</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTone}`}
          >
            {statusLabel}
          </span>
        </p>
      </header>
      <CaseTabsNav caseId={caseRow.id} current={currentTab} locale={locale} />
      <div className="pt-6">{children}</div>
    </section>
  )
}
