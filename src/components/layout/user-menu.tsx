"use client"

import { LogOut, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/features/auth/actions/sign-out"
import { Link } from "@/lib/i18n/navigation"

interface UserMenuProps {
  email: string
  locale: "es" | "en"
  initials: string
  labels: {
    dashboard: string
    services: string
    logout: string
    accountSrLabel: string
  }
}

export function UserMenu({ email, locale, initials, labels }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.accountSrLabel}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-white/76 px-2.5 py-1.5 text-xs font-extrabold text-foreground shadow-sm backdrop-blur-xl transition hover:bg-white"
      >
        <span className="grid size-7 place-items-center rounded-md bg-primary text-[0.7rem] font-black uppercase text-primary-foreground">
          {initials}
        </span>
        <span className="hidden max-w-[12ch] truncate sm:inline-block">{email}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={labels.accountSrLabel}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-xl border border-border/60 bg-white/95 shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-border/60 px-3 py-2 text-xs">
            <p className="font-extrabold text-foreground">{email}</p>
            <p className="text-[0.7rem] text-muted-foreground">
              {locale === "es" ? "Sesión activa" : "Signed in"}
            </p>
          </div>
          <ul className="flex flex-col py-1 text-sm font-semibold">
            <li>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60"
              >
                <User className="size-4" aria-hidden />
                {labels.dashboard}
              </Link>
            </li>
            <li>
              <Link
                href="/services"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60"
              >
                {labels.services}
              </Link>
            </li>
            <li className="border-t border-border/60">
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <Button
                  role="menuitem"
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 rounded-none px-3"
                >
                  <LogOut className="size-4" aria-hidden />
                  {labels.logout}
                </Button>
              </form>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
