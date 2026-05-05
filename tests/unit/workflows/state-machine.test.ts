import { describe, expect, it } from "vitest"
import { ALLOWED_TRANSITIONS, assertTransition, canTransition } from "@/server/workflows/_engine"
import type { IntakeStatus } from "@/shared/types/database"

const ALL_STATES: IntakeStatus[] = [
  "created",
  "contract_pending",
  "contract_signed",
  "payment_pending",
  "in_progress",
  "review_pending",
  "needs_correction",
  "approved",
  "finalized",
  "archived",
  "cancelled",
]

describe("intake_status state machine", () => {
  it("happy path completo está permitido", () => {
    const path: IntakeStatus[] = [
      "created",
      "contract_pending",
      "contract_signed",
      "payment_pending",
      "in_progress",
      "review_pending",
      "approved",
      "finalized",
      "archived",
    ]
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]
      const to = path[i + 1]
      if (!from || !to) throw new Error("path mismatch")
      expect(canTransition(from, to)).toBe(true)
    }
  })

  it("permite cancelar desde cualquier estado activo", () => {
    const cancellable: IntakeStatus[] = [
      "created",
      "contract_pending",
      "contract_signed",
      "payment_pending",
      "in_progress",
      "review_pending",
      "needs_correction",
    ]
    for (const s of cancellable) {
      expect(canTransition(s, "cancelled")).toBe(true)
    }
  })

  it("bloquea retroceso de finalized → in_progress", () => {
    expect(canTransition("finalized", "in_progress")).toBe(false)
  })

  it("archived es terminal — no permite ninguna transición saliente", () => {
    for (const target of ALL_STATES) {
      expect(canTransition("archived", target)).toBe(false)
    }
  })

  it("cancelled es terminal", () => {
    for (const target of ALL_STATES) {
      expect(canTransition("cancelled", target)).toBe(false)
    }
  })

  it("review_pending puede ir a needs_correction o approved", () => {
    expect(canTransition("review_pending", "needs_correction")).toBe(true)
    expect(canTransition("review_pending", "approved")).toBe(true)
  })

  it("needs_correction → in_progress (cliente puede reeditar)", () => {
    expect(canTransition("needs_correction", "in_progress")).toBe(true)
  })

  it("approved puede regresar a needs_correction (lawyer cambia de opinión)", () => {
    expect(canTransition("approved", "needs_correction")).toBe(true)
  })

  it("assertTransition lanza Error cuando inválido", () => {
    expect(() => assertTransition("created", "finalized")).toThrow(/Invalid intake transition/)
  })

  it("ALLOWED_TRANSITIONS cubre todos los estados como source", () => {
    for (const s of ALL_STATES) {
      expect(ALLOWED_TRANSITIONS[s]).toBeDefined()
    }
  })
})
