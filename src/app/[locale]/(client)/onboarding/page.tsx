import { ShieldCheck } from "lucide-react"
import { redirect } from "next/navigation"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard"
import type { OnboardingStep } from "@/features/onboarding/state"
import type { Locale } from "@/lib/i18n/routing"
import { createServerClient } from "@/lib/supabase/server"

export default async function OnboardingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, date_of_birth, utah_residency_verified")
    .eq("id", user.id)
    .single()

  const { count: consentCount } = await supabase
    .from("consents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const startStep: OnboardingStep = pickStartStep({
    hasPersonalInfo: !!profile?.full_name && !!profile?.date_of_birth,
    hasResidencySubmitted: !!profile?.utah_residency_verified,
    hasConsents: (consentCount ?? 0) >= 8,
  })

  const t = await getTranslations({ locale, namespace: "Onboarding" })
  const messages = (await getMessages({ locale })) as {
    Consents: { items: Record<string, { version: string; text: string }> }
  }

  return (
    <section className="page-shell flex max-w-3xl flex-1 flex-col items-center">
      <p className="brand-kicker mb-5">
        <ShieldCheck className="size-3.5" aria-hidden />
        Utah onboarding
      </p>
      <h1 className="mb-7 text-center text-4xl font-black leading-tight tracking-normal sm:text-5xl">
        {t("title")}
      </h1>
      <OnboardingWizard
        locale={locale}
        consentTexts={messages.Consents.items}
        startStep={startStep}
      />
    </section>
  )
}

function pickStartStep(state: {
  hasPersonalInfo: boolean
  hasResidencySubmitted: boolean
  hasConsents: boolean
}): OnboardingStep {
  if (!state.hasPersonalInfo) return "personal"
  if (!state.hasResidencySubmitted) return "residency"
  if (!state.hasConsents) return "consents"
  return "tutorial"
}
