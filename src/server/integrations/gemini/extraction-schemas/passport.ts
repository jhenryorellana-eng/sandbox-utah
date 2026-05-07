import { z } from "zod"

export const passportSchema = z.object({
  full_name: z.string().nullable(),
  passport_number: z.string().nullable(),
  country: z.string().nullable(),
  nationality: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  sex: z.string().nullable(),
})

export type PassportExtraction = z.infer<typeof passportSchema>
