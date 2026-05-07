import { z } from "zod"

export const incomeProofSchema = z.object({
  recipient_name: z.string().nullable(),
  employer: z.string().nullable(),
  period: z.string().nullable(),
  gross_amount_cents: z.number().int().nullable(),
  document_kind: z.string().nullable(),
})

export type IncomeProofExtraction = z.infer<typeof incomeProofSchema>
