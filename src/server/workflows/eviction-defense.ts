import "server-only"
import { z } from "zod"
import { registerWorkflow, type WorkflowDefinition } from "./_engine"

const partiesSchema = z.object({
  tenant_full_name: z.string().min(2),
  tenant_address_street: z.string().min(2),
  tenant_address_city: z.string().min(2),
  tenant_address_zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  landlord_name: z.string().min(2),
  property_address_same: z.boolean(),
  property_address_street: z.string().optional(),
  property_address_city: z.string().optional(),
  property_address_zip: z.string().optional(),
})

const noticeSchema = z.object({
  notice_type: z.enum([
    "3_day_pay_or_quit",
    "3_day_nuisance",
    "3_day_unlawful_business",
    "5_day_nonpayment",
    "15_day_no_cause",
    "other",
  ]),
  notice_received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  complaint_filed: z.boolean(),
  complaint_filed_date: z.string().optional(),
  hearing_date: z.string().optional(),
})

const reasonsSchema = z.object({
  has_lease: z.boolean(),
  rent_paid_in_full: z.boolean(),
  habitability_issues: z.boolean(),
  habitability_description: z.string().optional(),
  retaliation_concern: z.boolean(),
  discrimination_concern: z.boolean(),
})

const defensesSchema = z.object({
  tenant_paid_after_notice: z.boolean(),
  landlord_failed_to_repair: z.boolean(),
  improper_notice_service: z.boolean(),
  rental_assistance_pending: z.boolean(),
  other_defense: z.boolean(),
  other_defense_description: z.string().optional(),
})

const courtSchema = z.object({
  filing_county: z.string().min(2),
  fee_waiver_requested: z.boolean(),
  reviewed_summary: z.literal(true),
})

const fullSchema = partiesSchema
  .merge(noticeSchema)
  .merge(reasonsSchema)
  .merge(defensesSchema)
  .merge(courtSchema)
  .superRefine((data, ctx) => {
    if (!data.property_address_same) {
      const fields = [
        "property_address_street",
        "property_address_city",
        "property_address_zip",
      ] as const
      for (const f of fields) {
        if (!data[f]) {
          ctx.addIssue({
            code: "custom",
            path: [f],
            message: "Requerido si la propiedad arrendada no es la misma que tu dirección.",
          })
        }
      }
    }
    if (data.complaint_filed && !data.complaint_filed_date) {
      ctx.addIssue({
        code: "custom",
        path: ["complaint_filed_date"],
        message: "Indica cuándo se presentó la demanda.",
      })
    }
    if (data.habitability_issues && !data.habitability_description) {
      ctx.addIssue({
        code: "custom",
        path: ["habitability_description"],
        message: "Describe los problemas de habitabilidad.",
      })
    }
    if (data.other_defense && !data.other_defense_description) {
      ctx.addIssue({
        code: "custom",
        path: ["other_defense_description"],
        message: "Describe la defensa adicional.",
      })
    }
  })

export type EvictionDefenseFormData = z.infer<typeof fullSchema>

export const evictionDefenseWorkflow: WorkflowDefinition<EvictionDefenseFormData> = {
  slug: "eviction-defense",
  pdfTemplate: "utah-eviction-answer.pdf",
  formSchema: fullSchema,
  steps: [
    {
      id: "parties",
      titleEs: "Las partes",
      titleEn: "The parties",
      schema: partiesSchema,
      fields: [
        {
          id: "tenant_full_name",
          type: "text",
          labelEs: "Tu nombre legal completo",
          labelEn: "Your full legal name",
          required: true,
        },
        {
          id: "tenant_address_street",
          type: "text",
          labelEs: "Tu calle",
          labelEn: "Your street",
          required: true,
        },
        {
          id: "tenant_address_city",
          type: "text",
          labelEs: "Tu ciudad",
          labelEn: "Your city",
          required: true,
        },
        {
          id: "tenant_address_zip",
          type: "text",
          labelEs: "Tu ZIP",
          labelEn: "Your ZIP",
          required: true,
        },
        {
          id: "landlord_name",
          type: "text",
          labelEs: "Nombre del landlord o property manager",
          labelEn: "Landlord or property manager name",
          required: true,
        },
        {
          id: "property_address_same",
          type: "checkbox",
          labelEs: "La propiedad arrendada es la misma que mi dirección",
          labelEn: "Rented property is the same as my address",
        },
      ],
    },
    {
      id: "notice",
      titleEs: "El aviso recibido",
      titleEn: "The notice received",
      schema: noticeSchema,
      fields: [
        {
          id: "notice_type",
          type: "select",
          labelEs: "Tipo de aviso",
          labelEn: "Notice type",
          required: true,
          options: [
            {
              value: "3_day_pay_or_quit",
              labelEs: "3 días por falta de pago",
              labelEn: "3-day Pay or Quit",
            },
            {
              value: "3_day_nuisance",
              labelEs: "3 días por nuisance",
              labelEn: "3-day Nuisance",
            },
            {
              value: "3_day_unlawful_business",
              labelEs: "3 días por negocio ilegal",
              labelEn: "3-day Unlawful Business",
            },
            {
              value: "5_day_nonpayment",
              labelEs: "5 días por falta de pago",
              labelEn: "5-day Non-payment",
            },
            {
              value: "15_day_no_cause",
              labelEs: "15 días sin causa",
              labelEn: "15-day No Cause",
            },
            { value: "other", labelEs: "Otro", labelEn: "Other" },
          ],
        },
        {
          id: "notice_received_date",
          type: "date",
          labelEs: "Fecha en que recibiste el aviso",
          labelEn: "Date you received the notice",
          required: true,
        },
        {
          id: "complaint_filed",
          type: "checkbox",
          labelEs: "El landlord ya presentó la demanda en corte",
          labelEn: "Landlord already filed the lawsuit",
        },
      ],
    },
    {
      id: "reasons",
      titleEs: "Tu situación",
      titleEn: "Your situation",
      schema: reasonsSchema,
      fields: [
        {
          id: "has_lease",
          type: "checkbox",
          labelEs: "Tengo un contrato de arrendamiento (lease)",
          labelEn: "I have a written lease",
        },
        {
          id: "rent_paid_in_full",
          type: "checkbox",
          labelEs: "He pagado toda la renta debida",
          labelEn: "I have paid all rent owed",
        },
        {
          id: "habitability_issues",
          type: "checkbox",
          labelEs: "Hay problemas serios de habitabilidad (no agua, no calefacción, plagas, etc.)",
          labelEn: "There are serious habitability issues",
        },
        {
          id: "retaliation_concern",
          type: "checkbox",
          labelEs: "Sospecho que el desalojo es retaliación por reportar problemas",
          labelEn: "I suspect retaliation for reporting issues",
        },
        {
          id: "discrimination_concern",
          type: "checkbox",
          labelEs: "Sospecho discriminación (raza, idioma, familia, etc.)",
          labelEn: "I suspect discrimination",
        },
      ],
    },
    {
      id: "defenses",
      titleEs: "Defensas afirmativas",
      titleEn: "Affirmative defenses",
      schema: defensesSchema,
      fields: [
        {
          id: "tenant_paid_after_notice",
          type: "checkbox",
          labelEs: "Pagué la renta después de recibir el aviso",
          labelEn: "I paid rent after receiving the notice",
        },
        {
          id: "landlord_failed_to_repair",
          type: "checkbox",
          labelEs: "El landlord no hizo reparaciones que se le pidieron",
          labelEn: "Landlord failed to make requested repairs",
        },
        {
          id: "improper_notice_service",
          type: "checkbox",
          labelEs: "El aviso no fue entregado correctamente",
          labelEn: "The notice was not properly served",
        },
        {
          id: "rental_assistance_pending",
          type: "checkbox",
          labelEs: "Tengo asistencia de renta pendiente de aprobar",
          labelEn: "I have pending rental assistance",
        },
        {
          id: "other_defense",
          type: "checkbox",
          labelEs: "Otra defensa",
          labelEn: "Other defense",
        },
      ],
    },
    {
      id: "court",
      titleEs: "Corte y revisión final",
      titleEn: "Court and final review",
      schema: courtSchema,
      fields: [
        {
          id: "filing_county",
          type: "text",
          labelEs: "Condado de la corte",
          labelEn: "Court county",
          required: true,
        },
        {
          id: "fee_waiver_requested",
          type: "checkbox",
          labelEs: "Solicitaré fee waiver",
          labelEn: "I will request a fee waiver",
        },
        {
          id: "reviewed_summary",
          type: "checkbox",
          labelEs: "Revisé toda la información y la apruebo",
          labelEn: "I reviewed all the information and approve",
          required: true,
        },
      ],
    },
  ],
}

registerWorkflow(evictionDefenseWorkflow)
