import { z } from "zod"

export const idGuardianSchema = z.object({
  full_name: z.string().nullable(),
  document_number: z.string().nullable(),
  document_type: z.string().nullable(),
  address: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  issue_state: z.string().nullable(),
  expiry_date: z.string().nullable(),
})

export type IdGuardianExtraction = z.infer<typeof idGuardianSchema>
