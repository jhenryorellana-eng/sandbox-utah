import { z } from "zod"

export const birthCertificateSchema = z.object({
  full_name: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  place_of_birth: z.string().nullable(),
  country: z.string().nullable(),
  mother_name: z.string().nullable(),
  father_name: z.string().nullable(),
  registry_number: z.string().nullable(),
  notes: z.string().nullable(),
})

export type BirthCertificateExtraction = z.infer<typeof birthCertificateSchema>
