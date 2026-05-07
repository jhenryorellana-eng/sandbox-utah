import { describe, expect, it } from "vitest"
import {
  ALL_INTAKE_STATUSES,
  canTransition,
  isClientEditable,
  isTerminal,
  nextAllowedStatuses,
} from "@/features/cases/state-machine"

describe("intake_status state machine", () => {
  it("permite created → contract_pending solo a system", () => {
    expect(canTransition({ from: "created", to: "contract_pending", role: "system" })).toBe(true)
    expect(canTransition({ from: "created", to: "contract_pending", role: "client" })).toBe(false)
    expect(canTransition({ from: "created", to: "contract_pending", role: "admin" })).toBe(false)
  })

  it("permite contract_pending → contract_signed solo a system (webhook)", () => {
    expect(canTransition({ from: "contract_pending", to: "contract_signed", role: "system" })).toBe(
      true,
    )
    expect(canTransition({ from: "contract_pending", to: "contract_signed", role: "admin" })).toBe(
      false,
    )
  })

  it("admin puede aprobar/rechazar review_pending pero cliente no", () => {
    expect(canTransition({ from: "review_pending", to: "approved", role: "admin" })).toBe(true)
    expect(canTransition({ from: "review_pending", to: "needs_correction", role: "admin" })).toBe(
      true,
    )
    expect(canTransition({ from: "review_pending", to: "approved", role: "client" })).toBe(false)
  })

  it("estados terminales no transicionan", () => {
    expect(canTransition({ from: "archived", to: "in_progress", role: "admin" })).toBe(false)
    expect(canTransition({ from: "cancelled", to: "in_progress", role: "admin" })).toBe(false)
    expect(isTerminal("archived")).toBe(true)
    expect(isTerminal("cancelled")).toBe(true)
    expect(isTerminal("approved")).toBe(false)
  })

  it("isClientEditable cubre los estados early del intake", () => {
    expect(isClientEditable("created")).toBe(true)
    expect(isClientEditable("contract_pending")).toBe(true)
    expect(isClientEditable("in_progress")).toBe(true)
    expect(isClientEditable("needs_correction")).toBe(true)
    expect(isClientEditable("approved")).toBe(false)
    expect(isClientEditable("finalized")).toBe(false)
  })

  it("nextAllowedStatuses retorna lista válida por rol", () => {
    const adminFromReview = nextAllowedStatuses("review_pending", "admin")
    expect(adminFromReview).toContain("approved")
    expect(adminFromReview).toContain("needs_correction")
    expect(adminFromReview).toContain("cancelled")

    const clientFromReview = nextAllowedStatuses("review_pending", "client")
    expect(clientFromReview).toEqual([])
  })

  it("transición a sí mismo siempre es válida (idempotente)", () => {
    expect(canTransition({ from: "in_progress", to: "in_progress", role: "client" })).toBe(true)
  })

  it("ALL_INTAKE_STATUSES contiene los 11 estados del check constraint", () => {
    expect(ALL_INTAKE_STATUSES).toHaveLength(11)
    expect(ALL_INTAKE_STATUSES).toContain("created")
    expect(ALL_INTAKE_STATUSES).toContain("finalized")
  })
})
