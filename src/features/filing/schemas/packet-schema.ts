import { z } from "zod"

export const printScopeSchema = z.enum([
  "full_packet",
  "intake_only",
  "case_only",
  "single_form",
  "cover_sheet",
])

export const printPacketSchema = z
  .object({
    caseId: z.string().uuid(),
    scope: printScopeSchema,
    formCode: z.string().max(40).optional(),
  })
  .refine((v) => v.scope !== "single_form" || !!v.formCode, {
    message: "formCode requerido cuando scope=single_form",
  })

export type PrintPacketInput = z.infer<typeof printPacketSchema>
export type PrintScope = z.infer<typeof printScopeSchema>
