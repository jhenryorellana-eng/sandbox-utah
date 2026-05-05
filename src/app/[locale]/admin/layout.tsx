import { setRequestLocale } from "next-intl/server"
import { AdminShell } from "@/features/admin/components/admin-shell"
import { requireAdmin } from "@/features/admin/guard"
import type { Locale } from "@/lib/i18n/routing"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = (locale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(safeLocale)
  await requireAdmin(safeLocale)

  return <AdminShell locale={safeLocale}>{children}</AdminShell>
}
