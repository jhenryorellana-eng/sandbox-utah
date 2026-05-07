import {
  BadgeDollarSign,
  BookOpen,
  FileSearch,
  Gauge,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { ComponentType, ReactNode } from "react"
import { BrandMark } from "@/components/layout/brand-mark"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

interface NavItem {
  href: string
  labelKey:
    | "dashboard"
    | "identityVerifications"
    | "payments"
    | "catalog"
    | "complaints"
    | "compliance"
  icon: ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: Gauge },
  { href: "/admin/identity-verifications", labelKey: "identityVerifications", icon: ShieldCheck },
  { href: "/admin/payments", labelKey: "payments", icon: BadgeDollarSign },
  { href: "/admin/catalog", labelKey: "catalog", icon: BookOpen },
  { href: "/admin/complaints", labelKey: "complaints", icon: MessageSquareWarning },
  { href: "/admin/compliance", labelKey: "compliance", icon: FileSearch },
]

export function AdminShell({ children, locale: _locale }: { children: ReactNode; locale: Locale }) {
  return (
    <div className="page-shell grid w-full flex-1 gap-6 lg:grid-cols-[17rem_1fr]">
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  )
}

function Sidebar() {
  const t = useTranslations("Admin.nav")
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="glass-panel rounded-lg p-4">
        <div className="hidden pb-4 lg:block">
          <BrandMark />
          <p className="mt-4 text-xs font-bold leading-5 text-muted-foreground">
            Console interna para pagos, identidad, catalogo y compliance del sandbox.
          </p>
        </div>
        <nav aria-label="Admin">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-muted-foreground transition hover:bg-white/80 hover:text-primary lg:w-full"
                  >
                    <Icon className="size-4" aria-hidden />
                    {t(item.labelKey)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
