import { z } from "zod"

/**
 * Schema demo para una "Petición de Custodia" de Utah. Este es un placeholder
 * editable; cuando el cliente provea el PDF oficial del Utah State Courts, el
 * conjunto de campos se ajusta y se mapea a los AcroForm fields reales.
 */
export const demoPetitionSchema = z.object({
  petitioner_full_name: z.string().min(2, "Requerido"),
  petitioner_address: z.string().min(2, "Requerido"),
  petitioner_phone: z.string().min(7, "Requerido"),
  petitioner_email: z.string().email("Email inválido"),

  child_1_full_name: z.string().min(2, "Requerido"),
  child_1_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  child_1_birthplace: z.string().nullish(),

  child_2_full_name: z.string().nullish(),
  child_2_dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .nullish(),
  child_2_birthplace: z.string().nullish(),

  child_3_full_name: z.string().nullish(),
  child_3_dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .nullish(),
  child_3_birthplace: z.string().nullish(),

  child_4_full_name: z.string().nullish(),
  child_4_dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
    .nullish(),

  reason_summary: z.string().min(20, "Describe brevemente la razón (mínimo 20 caracteres)"),
})

export type DemoPetitionValues = z.infer<typeof demoPetitionSchema>

export const DEMO_PETITION_FIELD_GROUPS: Array<{
  title_es: string
  title_en: string
  fields: Array<keyof DemoPetitionValues>
}> = [
  {
    title_es: "Datos del peticionario",
    title_en: "Petitioner data",
    fields: ["petitioner_full_name", "petitioner_address", "petitioner_phone", "petitioner_email"],
  },
  {
    title_es: "Hijo 1",
    title_en: "Child 1",
    fields: ["child_1_full_name", "child_1_dob", "child_1_birthplace"],
  },
  {
    title_es: "Hijo 2 (opcional)",
    title_en: "Child 2 (optional)",
    fields: ["child_2_full_name", "child_2_dob", "child_2_birthplace"],
  },
  {
    title_es: "Hijo 3 (opcional)",
    title_en: "Child 3 (optional)",
    fields: ["child_3_full_name", "child_3_dob", "child_3_birthplace"],
  },
  {
    title_es: "Hijo 4 (opcional)",
    title_en: "Child 4 (optional)",
    fields: ["child_4_full_name", "child_4_dob"],
  },
  {
    title_es: "Resumen y motivo",
    title_en: "Summary and reason",
    fields: ["reason_summary"],
  },
]

export const DEMO_PETITION_FIELD_LABELS: Record<
  keyof DemoPetitionValues,
  { es: string; en: string }
> = {
  petitioner_full_name: { es: "Nombre completo del peticionario", en: "Petitioner full name" },
  petitioner_address: { es: "Dirección del peticionario", en: "Petitioner address" },
  petitioner_phone: { es: "Teléfono", en: "Phone" },
  petitioner_email: { es: "Correo electrónico", en: "Email" },
  child_1_full_name: { es: "Nombre del menor 1", en: "Child 1 name" },
  child_1_dob: { es: "Fecha de nacimiento (menor 1)", en: "Date of birth (child 1)" },
  child_1_birthplace: { es: "Lugar de nacimiento (menor 1)", en: "Place of birth (child 1)" },
  child_2_full_name: { es: "Nombre del menor 2", en: "Child 2 name" },
  child_2_dob: { es: "Fecha de nacimiento (menor 2)", en: "Date of birth (child 2)" },
  child_2_birthplace: { es: "Lugar de nacimiento (menor 2)", en: "Place of birth (child 2)" },
  child_3_full_name: { es: "Nombre del menor 3", en: "Child 3 name" },
  child_3_dob: { es: "Fecha de nacimiento (menor 3)", en: "Date of birth (child 3)" },
  child_3_birthplace: { es: "Lugar de nacimiento (menor 3)", en: "Place of birth (child 3)" },
  child_4_full_name: { es: "Nombre del menor 4", en: "Child 4 name" },
  child_4_dob: { es: "Fecha de nacimiento (menor 4)", en: "Date of birth (child 4)" },
  reason_summary: { es: "Resumen del motivo", en: "Reason summary" },
}
