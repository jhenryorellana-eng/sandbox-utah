import { useTranslations } from "next-intl"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

interface NavItem {
  href: string
  labelKey:
    | "dashboard"
    | "clients"
    | "identityVerifications"
    | "catalog"
    | "compliance"
    | "settings"
}

const NAV: NavItem[] = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/clients", labelKey: "clients" },
  { href: "/admin/identity-verifications", labelKey: "identityVerifications" },
  { href: "/admin/catalog", labelKey: "catalog" },
  { href: "/admin/compliance", labelKey: "compliance" },
  { href: "/admin/settings", labelKey: "settings" },
]

export function AdminShell({
  children,
  locale: _locale,
}: {
  children: React.ReactNode
  locale: Locale
}) {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-1 gap-6 px-4 py-8">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

function Sidebar() {
  const t = useTranslations("Admin.nav")
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav aria-label="Admin">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
