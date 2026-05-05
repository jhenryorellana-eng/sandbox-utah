import { describe, expect, it } from "vitest"
import {
  identityApprovedEmail,
  identityRejectedEmail,
  welcomeEmail,
} from "@/server/integrations/resend/templates"

describe("resend templates", () => {
  it("welcome ES contiene el complaint banner", () => {
    const t = welcomeEmail("es", "Juan")
    expect(t.subject.toLowerCase()).toContain("bienvenido")
    expect(t.html).toContain("utahinnovationoffice.org/sandbox-customer-complaint")
    expect(t.html).toContain("NO es un bufete de abogados")
  })

  it("welcome EN contiene el complaint banner", () => {
    const t = welcomeEmail("en", "John")
    expect(t.subject.toLowerCase()).toContain("welcome")
    expect(t.html).toContain("utahinnovationoffice.org/sandbox-customer-complaint")
    expect(t.html).toContain("NOT a law firm")
  })

  it("welcome escapa caracteres HTML peligrosos", () => {
    const t = welcomeEmail("es", "<script>alert(1)</script>")
    expect(t.html).not.toContain("<script>")
    expect(t.html).toContain("&lt;script&gt;")
  })

  it("identityApprovedEmail bilingüe", () => {
    expect(identityApprovedEmail("es").subject).toContain("Residencia")
    expect(identityApprovedEmail("en").subject).toContain("residency")
  })

  it("identityRejectedEmail incluye razón escapada", () => {
    const tpl = identityRejectedEmail("es", "ID expirado <test>")
    expect(tpl.html).toContain("ID expirado &lt;test&gt;")
    expect(tpl.html).not.toContain("<test>")
  })
})
