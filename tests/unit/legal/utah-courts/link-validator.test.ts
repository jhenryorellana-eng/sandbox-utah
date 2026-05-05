import { describe, expect, it } from "vitest"
import { isAllowedHost } from "@/server/legal/utah-courts/link-validator"

describe("isAllowedHost", () => {
  it("permite hosts oficiales de utcourts.gov / le.utah.gov", () => {
    expect(isAllowedHost("https://www.utcourts.gov/forms/x.pdf")).toBe(true)
    expect(isAllowedHost("https://utcourts.gov/forms/x.pdf")).toBe(true)
    expect(isAllowedHost("https://legacy.utcourts.gov/howto/x.pdf")).toBe(true)
    expect(isAllowedHost("https://le.utah.gov/xcode/x.pdf")).toBe(true)
    expect(isAllowedHost("https://utahinnovationoffice.org/page")).toBe(true)
  })

  it("rechaza hosts no permitidos (SSRF guard)", () => {
    expect(isAllowedHost("https://evil.example.com/x.pdf")).toBe(false)
    expect(isAllowedHost("http://localhost/x.pdf")).toBe(false)
    expect(isAllowedHost("https://utcourts.gov.evil.com/x.pdf")).toBe(false)
  })

  it("rechaza protocolos no http/https", () => {
    expect(isAllowedHost("file:///etc/passwd")).toBe(false)
    expect(isAllowedHost("javascript:alert(1)")).toBe(false)
  })

  it("retorna false con URL inválida", () => {
    expect(isAllowedHost("no-es-url")).toBe(false)
    expect(isAllowedHost("")).toBe(false)
  })
})
