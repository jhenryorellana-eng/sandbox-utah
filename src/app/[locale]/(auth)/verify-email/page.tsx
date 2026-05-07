import { MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { BrandMark } from "@/components/layout/brand-mark"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/lib/i18n/routing"

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ email?: string }>
}) {
  const { locale } = await params
  const { email = "" } = await searchParams
  setRequestLocale(locale)
  return <VerifyEmail email={email} />
}

function VerifyEmail({ email }: { email: string }) {
  const t = useTranslations("Auth")
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-in-up">
        <CardHeader className="space-y-5">
          <BrandMark />
          <div>
            <span className="mb-3 grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <MailCheck className="size-5" aria-hidden />
            </span>
            <CardTitle>{t("verifyTitle")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            {t("verifyBody", { email: email || "tu correo" })}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
