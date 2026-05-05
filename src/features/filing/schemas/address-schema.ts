import { z } from "zod"

export const confirmCountySchema = z.object({
  caseId: z.string().uuid(),
  countyFips: z
    .string()
    .regex(/^49\d{3}$/, { message: "FIPS code inválido (debe iniciar con 49)" }),
})

export type ConfirmCountyInput = z.infer<typeof confirmCountySchema>
