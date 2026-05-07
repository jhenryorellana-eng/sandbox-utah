import { ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { BrandMark } from "@/components/layout/brand-mark"
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
    <section className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-in-up">
        <CardHeader className="space-y-5">
          <BrandMark />
          <div>
            <p className="brand-kicker mb-3">
              <ShieldCheck className="size-3.5" aria-hidden />
              Utah-first onboarding
            </p>
            <CardTitle className="text-2xl">{t("signUpTitle")}</CardTitle>
            <CardDescription>{t("signUpSubtitle")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignUpForm locale={locale} />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-extrabold text-primary hover:underline">
              {t("links.haveAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
