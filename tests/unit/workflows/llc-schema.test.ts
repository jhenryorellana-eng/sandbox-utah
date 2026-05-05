import { describe, expect, it } from "vitest"
import { llcFormationWorkflow } from "@/server/workflows/llc-formation"

const baseValid = {
  llc_name: "Latino Foods LLC",
  formation_state: "UT",
  effective_date_immediate: true,
  purpose_general: true,
  duration_perpetual: true,
  registered_agent_name: "Juan Pérez",
  registered_agent_address_street: "123 Main St",
  registered_agent_address_city: "Salt Lake City",
  registered_agent_address_state: "UT",
  registered_agent_address_zip: "84101",
  management_type: "member_managed",
  number_of_members: 1,
  primary_member_name: "Juan Pérez",
  ein_intent: true,
  filing_method: "online",
  reviewed_summary: true,
}

describe("llc-formation workflow", () => {
  it("registra correctamente con 5 steps", () => {
    expect(llcFormationWorkflow.slug).toBe("llc-formation")
    expect(llcFormationWorkflow.steps.map((s) => s.id)).toEqual([
      "entity",
      "purpose",
      "agent",
      "members",
      "final",
    ])
  })

  it("acepta input válido completo", () => {
    const r = llcFormationWorkflow.formSchema.safeParse(baseValid)
    expect(r.success).toBe(true)
  })

  it('exige nombre que termine con "LLC"', () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      llc_name: "Latino Foods Inc",
    })
    expect(r.success).toBe(false)
  })

  it('acepta "L.L.C." y "Limited Liability Company" como sufijo', () => {
    expect(
      llcFormationWorkflow.formSchema.safeParse({ ...baseValid, llc_name: "Foo L.L.C." }).success,
    ).toBe(true)
    expect(
      llcFormationWorkflow.formSchema.safeParse({
        ...baseValid,
        llc_name: "Bar Limited Liability Company",
      }).success,
    ).toBe(true)
  })

  it("rechaza state distinto de UT", () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      formation_state: "CA",
    })
    expect(r.success).toBe(false)
  })

  it("exige duration_years si duration_perpetual=false", () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      duration_perpetual: false,
    })
    expect(r.success).toBe(false)
  })

  it("exige effective_date_specific si immediate=false", () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      effective_date_immediate: false,
    })
    expect(r.success).toBe(false)
  })

  it("rechaza number_of_members > 50", () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      number_of_members: 51,
    })
    expect(r.success).toBe(false)
  })

  it("exige reviewed_summary=true", () => {
    const r = llcFormationWorkflow.formSchema.safeParse({
      ...baseValid,
      reviewed_summary: false,
    })
    expect(r.success).toBe(false)
  })
})
