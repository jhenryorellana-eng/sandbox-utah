import { describe, expect, it } from "vitest"
import { maskEmail } from "@/server/compliance/audit-log"

describe("maskEmail", () => {
  it("enmascara user pero conserva dominio", () => {
    expect(maskEmail("henry@example.com")).toBe("***@example.com")
  })

  it("acepta dominios con subdominio", () => {
    expect(maskEmail("test@mail.utah.gov")).toBe("***@mail.utah.gov")
  })

  it("retorna *** si no hay @", () => {
    expect(maskEmail("malformed")).toBe("***")
  })

  it("retorna *** si @ está al inicio", () => {
    expect(maskEmail("@example.com")).toBe("***")
  })
})
