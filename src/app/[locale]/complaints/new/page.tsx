import { setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComplaintForm } from "@/features/complaints/components/complaint-form"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function NewComplaintPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === "en" ? "en" : "es") satisfies Locale
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const defaultEmail = user?.email ?? undefined

  return (
    <section className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{locale === "es" ? "Presentar una queja" : "Submit a complaint"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Tu queja se registra en nuestro sistema y puede reportarse al Utah Office of Legal Services Innovation. Respondemos en 5 días hábiles."
              : "Your complaint is recorded in our system and may be reported to the Utah Office of Legal Services Innovation. We respond within 5 business days."}
          </p>
        </CardHeader>
        <CardContent>
          <ComplaintForm locale={locale} {...(defaultEmail ? { defaultEmail } : {})} />
        </CardContent>
      </Card>
    </section>
  )
}
