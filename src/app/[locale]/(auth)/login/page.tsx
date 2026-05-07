import { ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { BrandMark } from "@/components/layout/brand-mark"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <Login locale={locale} />
}

function Login({ locale }: { locale: Locale }) {
  const t = useTranslations("Auth")
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-in-up">
        <CardHeader className="space-y-5">
          <BrandMark />
          <div>
            <p className="brand-kicker mb-3">
              <ShieldCheck className="size-3.5" aria-hidden />
              Sandbox Phase 2
            </p>
            <CardTitle className="text-2xl">{t("signInTitle")}</CardTitle>
            <CardDescription>{t("signInSubtitle")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<FormSkeleton />}>
            <SignInForm locale={locale} />
          </Suspense>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/register" className="font-extrabold text-primary hover:underline">
              {t("links.noAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
    </div>
  )
}
