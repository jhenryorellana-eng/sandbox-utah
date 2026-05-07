import { z } from "zod"

export const witnessIdSchema = z.object({
  full_name: z.string().nullable(),
  document_number: z.string().nullable(),
  document_type: z.string().nullable(),
})

export type WitnessIdExtraction = z.infer<typeof witnessIdSchema>
