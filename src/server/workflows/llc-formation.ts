import "server-only"
import { z } from "zod"
import { registerWorkflow, type WorkflowDefinition } from "./_engine"

const entitySchema = z.object({
  llc_name: z
    .string()
    .min(2)
    .regex(
      /(LLC|L\.L\.C\.|Limited Liability Company)\s*$/i,
      'El nombre debe terminar con "LLC", "L.L.C." o "Limited Liability Company".',
    ),
  alternate_name_1: z.string().optional(),
  alternate_name_2: z.string().optional(),
  formation_state: z.literal("UT"),
  effective_date_immediate: z.boolean(),
  effective_date_specific: z.string().optional(),
})

const purposeSchema = z.object({
  purpose_general: z.boolean(),
  purpose_description: z.string().optional(),
  duration_perpetual: z.boolean(),
  duration_years: z.number().int().min(1).max(99).optional(),
})

const agentSchema = z.object({
  registered_agent_name: z.string().min(2),
  registered_agent_address_street: z.string().min(2),
  registered_agent_address_city: z.string().min(2),
  registered_agent_address_state: z.literal("UT"),
  registered_agent_address_zip: z.string().regex(/^\d{5}(-\d{4})?$/),
})

const membersSchema = z.object({
  management_type: z.enum(["member_managed", "manager_managed"]),
  number_of_members: z.number().int().min(1).max(50),
  primary_member_name: z.string().min(2),
})

const finalSchema = z.object({
  ein_intent: z.boolean(),
  filing_method: z.enum(["online", "mail", "in_person"]),
  reviewed_summary: z.literal(true),
})

const fullSchema = entitySchema
  .merge(purposeSchema)
  .merge(agentSchema)
  .merge(membersSchema)
  .merge(finalSchema)
  .superRefine((data, ctx) => {
    if (!data.effective_date_immediate && !data.effective_date_specific) {
      ctx.addIssue({
        code: "custom",
        path: ["effective_date_specific"],
        message: "Indica fecha específica si no es inmediata.",
      })
    }
    if (!data.purpose_general && !data.purpose_description) {
      ctx.addIssue({
        code: "custom",
        path: ["purpose_description"],
        message: "Describe el propósito específico si no es general.",
      })
    }
    if (!data.duration_perpetual && !data.duration_years) {
      ctx.addIssue({
        code: "custom",
        path: ["duration_years"],
        message: "Indica los años de duración si no es perpetua.",
      })
    }
  })

export type LlcFormationFormData = z.infer<typeof fullSchema>

export const llcFormationWorkflow: WorkflowDefinition<LlcFormationFormData> = {
  slug: "llc-formation",
  pdfTemplate: "utah-llc-articles-of-organization.pdf",
  formSchema: fullSchema,
  steps: [
    {
      id: "entity",
      titleEs: "Datos de la entidad",
      titleEn: "Entity data",
      schema: entitySchema,
      fields: [
        {
          id: "llc_name",
          type: "text",
          labelEs: "Nombre de la LLC",
          labelEn: "LLC name",
          hintEs: 'Debe terminar con "LLC", "L.L.C." o "Limited Liability Company".',
          hintEn: 'Must end with "LLC", "L.L.C." or "Limited Liability Company".',
          required: true,
        },
        {
          id: "alternate_name_1",
          type: "text",
          labelEs: "Nombre alterno 1 (opcional)",
          labelEn: "Alternate name 1 (optional)",
        },
        {
          id: "alternate_name_2",
          type: "text",
          labelEs: "Nombre alterno 2 (opcional)",
          labelEn: "Alternate name 2 (optional)",
        },
        {
          id: "formation_state",
          type: "select",
          labelEs: "Estado de formación",
          labelEn: "Formation state",
          required: true,
          options: [{ value: "UT", labelEs: "Utah", labelEn: "Utah" }],
        },
        {
          id: "effective_date_immediate",
          type: "checkbox",
          labelEs: "Vigencia inmediata al filing",
          labelEn: "Effective immediately upon filing",
        },
        {
          id: "effective_date_specific",
          type: "date",
          labelEs: "Fecha específica de vigencia",
          labelEn: "Specific effective date",
        },
      ],
    },
    {
      id: "purpose",
      titleEs: "Propósito y duración",
      titleEn: "Purpose and duration",
      schema: purposeSchema,
      fields: [
        {
          id: "purpose_general",
          type: "checkbox",
          labelEs: "Propósito general (cualquier actividad legal)",
          labelEn: "General purpose (any lawful business)",
        },
        {
          id: "purpose_description",
          type: "textarea",
          labelEs: "Descripción específica del propósito",
          labelEn: "Specific purpose description",
        },
        {
          id: "duration_perpetual",
          type: "checkbox",
          labelEs: "Duración perpetua",
          labelEn: "Perpetual duration",
        },
        {
          id: "duration_years",
          type: "number",
          labelEs: "Años de duración",
          labelEn: "Duration years",
        },
      ],
    },
    {
      id: "agent",
      titleEs: "Registered Agent",
      titleEn: "Registered Agent",
      schema: agentSchema,
      fields: [
        {
          id: "registered_agent_name",
          type: "text",
          labelEs: "Nombre del registered agent",
          labelEn: "Registered agent name",
          required: true,
        },
        {
          id: "registered_agent_address_street",
          type: "text",
          labelEs: "Calle (Utah)",
          labelEn: "Street (Utah)",
          required: true,
        },
        {
          id: "registered_agent_address_city",
          type: "text",
          labelEs: "Ciudad",
          labelEn: "City",
          required: true,
        },
        {
          id: "registered_agent_address_state",
          type: "select",
          labelEs: "Estado",
          labelEn: "State",
          required: true,
          options: [{ value: "UT", labelEs: "Utah", labelEn: "Utah" }],
        },
        {
          id: "registered_agent_address_zip",
          type: "text",
          labelEs: "ZIP",
          labelEn: "ZIP",
          required: true,
        },
      ],
    },
    {
      id: "members",
      titleEs: "Miembros y management",
      titleEn: "Members and management",
      schema: membersSchema,
      fields: [
        {
          id: "management_type",
          type: "select",
          labelEs: "Tipo de management",
          labelEn: "Management type",
          required: true,
          options: [
            {
              value: "member_managed",
              labelEs: "Manejada por miembros",
              labelEn: "Member-managed",
            },
            {
              value: "manager_managed",
              labelEs: "Manejada por managers",
              labelEn: "Manager-managed",
            },
          ],
        },
        {
          id: "number_of_members",
          type: "number",
          labelEs: "Número total de miembros",
          labelEn: "Total members",
          required: true,
        },
        {
          id: "primary_member_name",
          type: "text",
          labelEs: "Nombre del miembro principal",
          labelEn: "Primary member name",
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
          id: "ein_intent",
          type: "checkbox",
          labelEs: "Solicitaré EIN ante el IRS después del filing",
          labelEn: "I will apply for an EIN with the IRS after filing",
        },
        {
          id: "filing_method",
          type: "select",
          labelEs: "Método de filing",
          labelEn: "Filing method",
          required: true,
          options: [
            { value: "online", labelEs: "Online (Utah OneStop)", labelEn: "Online (Utah OneStop)" },
            { value: "mail", labelEs: "Por correo", labelEn: "By mail" },
            { value: "in_person", labelEs: "En persona", labelEn: "In person" },
          ],
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

registerWorkflow(llcFormationWorkflow)
