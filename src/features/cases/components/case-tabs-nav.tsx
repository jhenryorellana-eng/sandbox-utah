"use client"

import { Link, usePathname } from "@/lib/i18n/navigation"

export type CaseTabKey = "overview" | "documents" | "forms" | "payments" | "filing"

interface CaseTabsNavProps {
  caseId: string
  current: CaseTabKey
  locale: "es" | "en"
}

const TAB_ORDER: CaseTabKey[] = ["overview", "documents", "forms", "payments", "filing"]

const LABELS: Record<CaseTabKey, { es: string; en: string }> = {
  overview: { es: "Datos", en: "Overview" },
  documents: { es: "Documentos", en: "Documents" },
  forms: { es: "Formularios", en: "Forms" },
  payments: { es: "Pagos", en: "Payments" },
  filing: { es: "Radicación", en: "Filing" },
}

const PATH_BY_TAB: Record<CaseTabKey, (caseId: string) => string> = {
  overview: (id) => `/cases/${id}`,
  documents: (id) => `/cases/${id}/documents`,
  forms: (id) => `/cases/${id}/forms`,
  payments: (id) => `/cases/${id}/payments`,
  filing: (id) => `/cases/${id}/filing`,
}

export function CaseTabsNav({ caseId, current, locale }: CaseTabsNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Secciones del caso"
      className="rounded-lg border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur-xl"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {TAB_ORDER.map((tab) => {
          const href = PATH_BY_TAB[tab](caseId)
          const isActive = current === tab || pathname.endsWith(href)
          return (
            <li key={tab}>
              <Link
                href={href as never}
                aria-current={isActive ? "page" : undefined}
                className={
                  "inline-flex min-w-max items-center rounded-md px-3 py-2 text-sm font-extrabold transition-all " +
                  (isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white/80 hover:text-foreground")
                }
              >
                {LABELS[tab][locale]}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
