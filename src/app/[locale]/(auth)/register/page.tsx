import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { Link } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/routing"

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <Register locale={locale} />
}

function Register({ locale }: { locale: Locale }) {
  const t = useTranslations("Auth")
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("signUpTitle")}</CardTitle>
          <CardDescription>{t("signUpSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignUpForm locale={locale} />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              {t("links.haveAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
