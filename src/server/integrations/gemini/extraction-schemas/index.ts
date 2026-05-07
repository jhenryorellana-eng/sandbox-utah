import "server-only"
import type { z } from "zod"
import { birthCertificateSchema } from "./birth-certificate"
import { idGuardianSchema } from "./id-guardian"
import { incomeProofSchema } from "./income-proof"
import { leaseSchema } from "./lease"
import { passportSchema } from "./passport"
import { utilityBillSchema } from "./utility-bill"
import { witnessIdSchema } from "./witness-id"

export const EXTRACTION_SCHEMAS = {
  birth_certificate: birthCertificateSchema,
  passport: passportSchema,
  id_guardian: idGuardianSchema,
  lease: leaseSchema,
  utility_bill: utilityBillSchema,
  income_proof: incomeProofSchema,
  witness_id: witnessIdSchema,
} as const

export type ExtractionSchemaSlug = keyof typeof EXTRACTION_SCHEMAS

export type ExtractionPayload = {
  [K in ExtractionSchemaSlug]: z.infer<(typeof EXTRACTION_SCHEMAS)[K]>
}[ExtractionSchemaSlug]

export interface ExtractionSchemaMetadata {
  slug: ExtractionSchemaSlug
  name: string
  description_es: string
}

export const EXTRACTION_SCHEMA_DESCRIPTIONS: Record<ExtractionSchemaSlug, string> = {
  birth_certificate:
    "Acta o certificado de nacimiento. Extrae nombre completo, fechas, lugar de nacimiento y nombres de los padres si aparecen.",
  passport:
    "Pasaporte oficial. Extrae nombre completo, número de pasaporte, país emisor, fechas de emisión y vencimiento, y nacionalidad.",
  id_guardian:
    "Documento de identidad oficial del tutor (cédula, licencia, pasaporte). Extrae nombre, número de documento, tipo, dirección y fecha de nacimiento.",
  lease:
    "Contrato de arrendamiento. Extrae nombres de inquilinos, dirección de la propiedad, monto mensual de renta, fechas de inicio/fin y nombre del arrendador.",
  utility_bill:
    "Recibo de servicios públicos. Extrae nombre del titular, dirección de servicio, tipo de servicio, periodo facturado y monto.",
  income_proof:
    "Comprobante de ingresos (talón de pago, declaración, etc.). Extrae nombre del receptor, empleador, periodo, monto bruto y tipo de comprobante.",
  witness_id:
    "Documento de identidad de testigo. Extrae nombre completo y número/tipo de documento.",
}

export function getExtractionSchema(slug: string): z.ZodTypeAny | null {
  return (EXTRACTION_SCHEMAS as Record<string, z.ZodTypeAny>)[slug] ?? null
}
