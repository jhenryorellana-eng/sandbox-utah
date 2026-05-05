import "server-only"
import { z } from "zod"
import { registerWorkflow, type WorkflowDefinition } from "./_engine"

const partiesSchema = z.object({
  petitioner_full_name: z.string().min(2),
  petitioner_address_street: z.string().min(2),
  petitioner_address_city: z.string().min(2),
  petitioner_address_state: z.literal("UT"),
  petitioner_address_zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  respondent_full_name: z.string().min(2),
  respondent_address_known: z.boolean(),
  respondent_address_street: z.string().optional(),
  respondent_address_city: z.string().optional(),
  respondent_address_state: z.string().optional(),
  respondent_address_zip: z.string().optional(),
})

const marriageSchema = z.object({
  marriage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  marriage_city: z.string().min(2),
  marriage_state: z.string().min(2),
  separation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  utah_residency_months: z.number().int().min(3, "Utah requires 3+ months"),
})

const childrenSchema = z.object({
  has_minor_children: z.boolean(),
  number_of_children: z.number().int().min(0).max(15).optional(),
})

const propertySchema = z.object({
  has_real_property: z.boolean(),
  has_retirement_accounts: z.boolean(),
  has_debts_to_divide: z.boolean(),
  agreement_attached: z.boolean(),
})

const finalSchema = z.object({
  filing_county: z.string().min(2),
  fee_waiver_requested: z.boolean(),
  reviewed_summary: z.literal(true),
})

const fullSchema = partiesSchema
  .merge(marriageSchema)
  .merge(childrenSchema)
  .merge(propertySchema)
  .merge(finalSchema)
  .superRefine((data, ctx) => {
    if (new Date(data.separation_date) < new Date(data.marriage_date)) {
      ctx.addIssue({
        code: "custom",
        path: ["separation_date"],
        message: "La fecha de separación debe ser posterior a la fecha de matrimonio.",
      })
    }
    if (data.has_minor_children && !data.number_of_children) {
      ctx.addIssue({
        code: "custom",
        path: ["number_of_children"],
        message: "Indica el número de hijos menores.",
      })
    }
    if (data.respondent_address_known) {
      const fields = [
        "respondent_address_street",
        "respondent_address_city",
        "respondent_address_state",
        "respondent_address_zip",
      ] as const
      for (const f of fields) {
        if (!data[f]) {
          ctx.addIssue({
            code: "custom",
            path: [f],
            message: "Requerido si conoces la dirección del cónyuge.",
          })
        }
      }
    }
  })

export type UncontestedDivorceFormData = z.infer<typeof fullSchema>

export const uncontestedDivorceWorkflow: WorkflowDefinition<UncontestedDivorceFormData> = {
  slug: "uncontested-divorce",
  pdfTemplate: "utah-uncontested-divorce-petition.pdf",
  formSchema: fullSchema,
  steps: [
    {
      id: "parties",
      titleEs: "Las partes",
      titleEn: "The parties",
      descriptionEs: "Datos del peticionario y del cónyuge.",
      schema: partiesSchema,
      fields: [
        {
          id: "petitioner_full_name",
          type: "text",
          labelEs: "Tu nombre legal completo",
          labelEn: "Your full legal name",
          required: true,
        },
        {
          id: "petitioner_address_street",
          type: "text",
          labelEs: "Calle (Utah)",
          labelEn: "Street (Utah)",
          required: true,
        },
        {
          id: "petitioner_address_city",
          type: "text",
          labelEs: "Ciudad",
          labelEn: "City",
          required: true,
        },
        {
          id: "petitioner_address_state",
          type: "select",
          labelEs: "Estado",
          labelEn: "State",
          required: true,
          options: [{ value: "UT", labelEs: "Utah", labelEn: "Utah" }],
        },
        {
          id: "petitioner_address_zip",
          type: "text",
          labelEs: "ZIP",
          labelEn: "ZIP",
          required: true,
          placeholder: "84101",
        },
        {
          id: "respondent_full_name",
          type: "text",
          labelEs: "Nombre legal del cónyuge",
          labelEn: "Spouse legal name",
          required: true,
        },
        {
          id: "respondent_address_known",
          type: "checkbox",
          labelEs: "¿Conoces la dirección actual del cónyuge?",
          labelEn: "Do you know the spouse's current address?",
        },
      ],
    },
    {
      id: "marriage",
      titleEs: "El matrimonio",
      titleEn: "The marriage",
      schema: marriageSchema,
      fields: [
        {
          id: "marriage_date",
          type: "date",
          labelEs: "Fecha de matrimonio",
          labelEn: "Marriage date",
          required: true,
        },
        {
          id: "marriage_city",
          type: "text",
          labelEs: "Ciudad de matrimonio",
          labelEn: "Marriage city",
          required: true,
        },
        {
          id: "marriage_state",
          type: "text",
          labelEs: "Estado o país de matrimonio",
          labelEn: "Marriage state or country",
          required: true,
        },
        {
          id: "separation_date",
          type: "date",
          labelEs: "Fecha de separación",
          labelEn: "Separation date",
          required: true,
        },
        {
          id: "utah_residency_months",
          type: "number",
          labelEs: "Meses de residencia en Utah",
          labelEn: "Months of Utah residency",
          hintEs: "Utah requiere mínimo 3 meses de residencia para divorcio.",
          hintEn: "Utah requires at least 3 months residency for divorce.",
          required: true,
        },
      ],
    },
    {
      id: "children",
      titleEs: "Hijos menores",
      titleEn: "Minor children",
      schema: childrenSchema,
      fields: [
        {
          id: "has_minor_children",
          type: "checkbox",
          labelEs: "¿Tienen hijos menores en común?",
          labelEn: "Do you have minor children together?",
        },
        {
          id: "number_of_children",
          type: "number",
          labelEs: "Número de hijos menores",
          labelEn: "Number of minor children",
        },
      ],
    },
    {
      id: "property",
      titleEs: "Bienes y deudas",
      titleEn: "Property and debts",
      schema: propertySchema,
      fields: [
        {
          id: "has_real_property",
          type: "checkbox",
          labelEs: "¿Tienen bienes raíces compartidos?",
          labelEn: "Do you have shared real property?",
        },
        {
          id: "has_retirement_accounts",
          type: "checkbox",
          labelEs: "¿Tienen cuentas de retiro a dividir?",
          labelEn: "Retirement accounts to divide?",
        },
        {
          id: "has_debts_to_divide",
          type: "checkbox",
          labelEs: "¿Tienen deudas a dividir?",
          labelEn: "Debts to divide?",
        },
        {
          id: "agreement_attached",
          type: "checkbox",
          labelEs: "Tenemos un acuerdo escrito firmado por ambos",
          labelEn: "We have a signed written agreement",
          required: true,
        },
      ],
    },
    {
      id: "final",
      titleEs: "Confirmación final",
      titleEn: "Final confirmation",
      schema: finalSchema,
      fields: [
        {
          id: "filing_county",
          type: "text",
          labelEs: "Condado donde presentarás",
          labelEn: "County where you will file",
          required: true,
          placeholder: "Salt Lake County",
        },
        {
          id: "fee_waiver_requested",
          type: "checkbox",
          labelEs: "Solicitaré fee waiver (Motion to Waive Fees)",
          labelEn: "I will request a fee waiver",
        },
        {
          id: "reviewed_summary",
          type: "checkbox",
          labelEs: "Revisé toda la información y la apruebo para generar el PDF",
          labelEn: "I reviewed all the information and approve PDF generation",
          required: true,
        },
      ],
    },
  ],
}

registerWorkflow(uncontestedDivorceWorkflow)
