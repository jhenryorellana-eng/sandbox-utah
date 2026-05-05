import { z } from "zod"

export const ONBOARDING_STEPS = [
  "personal",
  "residency",
  "consents",
  "tutorial",
  "language",
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

const personalDataSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use ISO date YYYY-MM-DD"),
  phone: z.string().optional(),
})

export type PersonalData = z.infer<typeof personalDataSchema>

export function validatePersonalData(input: unknown):
  | {
      ok: true
      data: PersonalData
    }
  | { ok: false; errorCode: "validation" | "underage" | "invalid_dob" } {
  const parsed = personalDataSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }

  const dob = new Date(parsed.data.dateOfBirth)
  if (Number.isNaN(dob.getTime())) {
    return { ok: false, errorCode: "invalid_dob" }
  }

  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1

  if (age < 18) return { ok: false, errorCode: "underage" }

  return { ok: true, data: parsed.data }
}

export function nextStep(current: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(current)
  if (idx < 0 || idx === ONBOARDING_STEPS.length - 1) return null
  return ONBOARDING_STEPS[idx + 1] ?? null
}

export function prevStep(current: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(current)
  if (idx <= 0) return null
  return ONBOARDING_STEPS[idx - 1] ?? null
}
