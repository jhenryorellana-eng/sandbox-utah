import { z } from "zod"

export const leaseSchema = z.object({
  tenant_names: z.array(z.string()).nullable(),
  property_address: z.string().nullable(),
  monthly_rent_cents: z.number().int().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  landlord_name: z.string().nullable(),
})

export type LeaseExtraction = z.infer<typeof leaseSchema>
