import { z } from "zod"

const minorSnapshotSchema = z.object({
  displayIndex: z.number().int().min(1),
  fullName: z.string().min(1),
  dateOfBirth: z.string().nullish(),
  documentNumber: z.string().nullish(),
})

const tierSnapshotSchema = z.object({
  id: z.string().uuid(),
  beneficiariesCount: z.number().int().min(1),
  label_es: z.string().min(1),
  label_en: z.string().min(1),
  priceCents: z.number().int().min(0),
})

export const termsSnapshotV1Schema = z.object({
  serviceSlug: z.string().min(1),
  priceCents: z.number().int().min(0),
  refundPolicyDays: z.number().int().min(0),
  generatedAt: z.string().min(1),
})

export const termsSnapshotV2Schema = z.object({
  version: z.literal(2),
  serviceSlug: z.string().min(1),
  tier: tierSnapshotSchema.nullish(),
  priceCents: z.number().int().min(0),
  refundPolicyDays: z.number().int().min(0),
  minors: z.array(minorSnapshotSchema).optional(),
  generatedAt: z.string().min(1),
})

export type TermsSnapshotV1 = z.infer<typeof termsSnapshotV1Schema>
export type TermsSnapshotV2 = z.infer<typeof termsSnapshotV2Schema>
export type MinorSnapshot = z.infer<typeof minorSnapshotSchema>
export type TierSnapshot = z.infer<typeof tierSnapshotSchema>

export interface NormalizedTermsSnapshot {
  version: 2
  serviceSlug: string
  tier: TierSnapshot | null
  priceCents: number
  refundPolicyDays: number
  minors: MinorSnapshot[]
  generatedAt: string
  rawVersion: 1 | 2
}

export function parseTermsSnapshot(input: unknown): NormalizedTermsSnapshot {
  if (input && typeof input === "object" && (input as { version?: unknown }).version === 2) {
    const v2 = termsSnapshotV2Schema.parse(input)
    return {
      version: 2,
      serviceSlug: v2.serviceSlug,
      tier: v2.tier ?? null,
      priceCents: v2.priceCents,
      refundPolicyDays: v2.refundPolicyDays,
      minors: v2.minors ?? [],
      generatedAt: v2.generatedAt,
      rawVersion: 2,
    }
  }
  const v1 = termsSnapshotV1Schema.parse(input)
  return {
    version: 2,
    serviceSlug: v1.serviceSlug,
    tier: null,
    priceCents: v1.priceCents,
    refundPolicyDays: v1.refundPolicyDays,
    minors: [],
    generatedAt: v1.generatedAt,
    rawVersion: 1,
  }
}

export function buildTermsSnapshotV2(input: {
  serviceSlug: string
  tier?: TierSnapshot | null
  priceCents: number
  refundPolicyDays: number
  minors?: MinorSnapshot[]
}): TermsSnapshotV2 {
  const snapshot: TermsSnapshotV2 = {
    version: 2,
    serviceSlug: input.serviceSlug,
    tier: input.tier ?? null,
    priceCents: input.priceCents,
    refundPolicyDays: input.refundPolicyDays,
    generatedAt: new Date().toISOString(),
  }
  if (input.minors && input.minors.length > 0) {
    snapshot.minors = input.minors
  }
  return snapshot
}
