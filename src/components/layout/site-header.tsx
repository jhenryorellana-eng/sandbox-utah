import { getLocale, getTranslations } from "next-intl/server"
import { BrandMark } from "@/components/layout/brand-mark"
import { UserMenu } from "@/components/layout/user-menu"
import { Link } from "@/lib/i18n/navigation"
import { createServerClient } from "@/lib/supabase/server"

function computeInitials(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return "·"
  const localPart = trimmed.split("@")[0] ?? trimmed
  const parts = localPart
    .split(/[\s._+-]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return localPart.slice(0, 2).toUpperCase()
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase()
  const first = parts[0] ?? ""
  const second = parts[1] ?? ""
  return (first.charAt(0) + second.charAt(0)).toUpperCase()
}

export async function SiteHeader() {
  const [t, rawLocale] = await Promise.all([getTranslations("Nav"), getLocale()])
  const locale = (rawLocale === "en" ? "en" : "es") satisfies "es" | "en"

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName = ""
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
    displayName = profile?.full_name?.trim() || user.email || ""
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/72 px-4 py-3 shadow-[0_10px_30px_oklch(0.2_0.047_255_/_6%)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-3">
        <Link href="/" aria-label="USA Latino Prime Utah home" className="group rounded-lg">
          <BrandMark className="transition-transform duration-200 group-hover:-translate-y-0.5" />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/services"
            className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground sm:inline-flex"
          >
            {t("services")}
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
              >
                {t("dashboard")}
              </Link>
              <UserMenu
                email={user.email ?? displayName}
                locale={locale}
                initials={computeInitials(displayName || user.email || "")}
                labels={{
                  dashboard: t("dashboard"),
                  services: t("services"),
                  logout: t("logout"),
                  accountSrLabel: locale === "es" ? "Menú de cuenta" : "Account menu",
                }}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-extrabold text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="interactive-shine inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-extrabold text-primary-foreground shadow-[0_12px_26px_oklch(0.31_0.101_257_/_18%)] transition hover:-translate-y-0.5 hover:bg-primary/95"
              >
                {t("register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
