import { describe, expect, it } from "vitest"
import { uncontestedDivorceWorkflow } from "@/server/workflows/uncontested-divorce"

const fullValid = {
  petitioner_full_name: "Juan García",
  petitioner_address_street: "123 Main St",
  petitioner_address_city: "Salt Lake City",
  petitioner_address_state: "UT",
  petitioner_address_zip: "84101",
  respondent_full_name: "María López",
  respondent_address_known: false,
  marriage_date: "2015-06-12",
  marriage_city: "Provo",
  marriage_state: "UT",
  separation_date: "2025-11-01",
  utah_residency_months: 12,
  has_minor_children: false,
  has_real_property: false,
  has_retirement_accounts: false,
  has_debts_to_divide: false,
  agreement_attached: true,
  filing_county: "Salt Lake County",
  fee_waiver_requested: false,
  reviewed_summary: true,
}

describe("uncontested-divorce workflow", () => {
  it("registra el workflow correctamente", () => {
    expect(uncontestedDivorceWorkflow.slug).toBe("uncontested-divorce")
    expect(uncontestedDivorceWorkflow.steps.map((s) => s.id)).toEqual([
      "parties",
      "marriage",
      "children",
      "property",
      "final",
    ])
  })

  it("formSchema acepta input válido completo", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse(fullValid)
    expect(r.success).toBe(true)
  })

  it("rechaza state distinto de UT en peticionario", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      petitioner_address_state: "CA",
    })
    expect(r.success).toBe(false)
  })

  it("rechaza separación anterior al matrimonio (validación cruzada)", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      marriage_date: "2020-01-01",
      separation_date: "2010-01-01",
    })
    expect(r.success).toBe(false)
  })

  it("rechaza menos de 3 meses de residencia Utah", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      utah_residency_months: 1,
    })
    expect(r.success).toBe(false)
  })

  it("exige number_of_children si has_minor_children=true", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      has_minor_children: true,
    })
    expect(r.success).toBe(false)
  })

  it("exige direccion del cónyuge si respondent_address_known=true", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      respondent_address_known: true,
    })
    expect(r.success).toBe(false)
  })

  it("exige reviewed_summary=true en el último paso", () => {
    const r = uncontestedDivorceWorkflow.formSchema.safeParse({
      ...fullValid,
      reviewed_summary: false,
    })
    expect(r.success).toBe(false)
  })
})
