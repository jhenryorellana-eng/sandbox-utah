import { describe, expect, it } from "vitest"
import { validateFormCodesInOutput } from "@/server/integrations/gemini/guardrails"

describe("validateFormCodesInOutput — 6ª capa de guardrail", () => {
  const allowed = ["1100EV", "1105EV", "1044", "1301GE", "MYPAPERWORK-DIVORCE"] as const

  it("acepta texto sin form codes", () => {
    const result = validateFormCodesInOutput(
      "Tu caso se radica en el Tercer Distrito Judicial.",
      allowed,
    )
    expect(result.ok).toBe(true)
    expect(result.leaked).toEqual([])
  })

  it("acepta form codes en whitelist", () => {
    const result = validateFormCodesInOutput(
      "Llena el 1100EV y el 1105EV antes de presentar. La 1044 es la cover sheet.",
      allowed,
    )
    expect(result.ok).toBe(true)
    expect(result.leaked).toEqual([])
  })

  it("bloquea cuando el modelo inventa un form code", () => {
    const result = validateFormCodesInOutput(
      "Llena el 9999XX (formulario nuevo) junto con el 1100EV.",
      allowed,
    )
    expect(result.ok).toBe(false)
    expect(result.leaked).toContain("9999XX")
  })

  it("ignora años, ZIPs y números de teléfono", () => {
    const result = validateFormCodesInOutput(
      "En 2026, en el ZIP 84601, llama al 801-238-7300 para info.",
      allowed,
    )
    expect(result.ok).toBe(true)
  })

  it("ignora referencias a estatutos (78B-3a-201)", () => {
    const result = validateFormCodesInOutput(
      "Bajo UCA 78B-3a-201 el venue se determina por residencia.",
      allowed,
    )
    expect(result.ok).toBe(true)
  })

  it("detecta múltiples leaks", () => {
    const result = validateFormCodesInOutput("Usa el FAKE99 y el OTRO77.", allowed)
    expect(result.ok).toBe(false)
    expect(result.leaked.length).toBeGreaterThanOrEqual(1)
  })

  it("acepta MYPAPERWORK-DIVORCE (formato con guión)", () => {
    const result = validateFormCodesInOutput(
      "Genera tus documentos en MYPAPERWORK-DIVORCE.",
      allowed,
    )
    expect(result.ok).toBe(true)
  })
})
