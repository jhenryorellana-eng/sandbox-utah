import { z } from "zod"

export const utilityBillSchema = z.object({
  account_holder_name: z.string().nullable(),
  service_address: z.string().nullable(),
  service_type: z.string().nullable(),
  billing_period: z.string().nullable(),
  amount_cents: z.number().int().nullable(),
})

export type UtilityBillExtraction = z.infer<typeof utilityBillSchema>
