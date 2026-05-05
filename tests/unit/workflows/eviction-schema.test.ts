import { describe, expect, it } from "vitest"
import { evictionDefenseWorkflow } from "@/server/workflows/eviction-defense"

const baseValid = {
  tenant_full_name: "Juan Pérez",
  tenant_address_street: "123 Main St",
  tenant_address_city: "Salt Lake City",
  tenant_address_zip: "84101",
  landlord_name: "John Smith Property Co.",
  property_address_same: true,
  notice_type: "3_day_pay_or_quit",
  notice_received_date: "2026-04-15",
  complaint_filed: false,
  has_lease: true,
  rent_paid_in_full: false,
  habitability_issues: false,
  retaliation_concern: false,
  discrimination_concern: false,
  tenant_paid_after_notice: true,
  landlord_failed_to_repair: false,
  improper_notice_service: false,
  rental_assistance_pending: false,
  other_defense: false,
  filing_county: "Salt Lake County",
  fee_waiver_requested: true,
  reviewed_summary: true,
}

describe("eviction-defense workflow", () => {
  it("registra correctamente con 5 steps", () => {
    expect(evictionDefenseWorkflow.slug).toBe("eviction-defense")
    expect(evictionDefenseWorkflow.steps.map((s) => s.id)).toEqual([
      "parties",
      "notice",
      "reasons",
      "defenses",
      "court",
    ])
  })

  it("acepta input válido", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse(baseValid)
    expect(r.success).toBe(true)
  })

  it("exige property_address_* si property_address_same=false", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse({
      ...baseValid,
      property_address_same: false,
    })
    expect(r.success).toBe(false)
  })

  it("exige complaint_filed_date si complaint_filed=true", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse({
      ...baseValid,
      complaint_filed: true,
    })
    expect(r.success).toBe(false)
  })

  it("exige descripción de habitability_issues si true", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse({
      ...baseValid,
      habitability_issues: true,
    })
    expect(r.success).toBe(false)
  })

  it("rechaza notice_type fuera de los enums", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse({
      ...baseValid,
      notice_type: "10_day_random",
    })
    expect(r.success).toBe(false)
  })

  it("exige reviewed_summary=true", () => {
    const r = evictionDefenseWorkflow.formSchema.safeParse({
      ...baseValid,
      reviewed_summary: false,
    })
    expect(r.success).toBe(false)
  })
})
