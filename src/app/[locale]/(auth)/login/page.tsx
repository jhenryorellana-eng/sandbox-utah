import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
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
    <section className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("signInTitle")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<FormSkeleton />}>
            <SignInForm locale={locale} />
          </Suspense>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/register" className="text-primary hover:underline">
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
