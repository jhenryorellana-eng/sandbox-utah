import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const originalKey = process.env.DROPBOX_SIGN_API_KEY

describe("createSignatureRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    if (originalKey === undefined) {
      process.env.DROPBOX_SIGN_API_KEY = ""
    } else {
      process.env.DROPBOX_SIGN_API_KEY = originalKey
    }
  })

  it("sin API key entra en stub mode con ID predecible", async () => {
    process.env.DROPBOX_SIGN_API_KEY = ""
    vi.resetModules()
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { createSignatureRequest } = await import("@/server/integrations/dropbox-sign/client")
    const r = await createSignatureRequest({
      contractNumber: "CTR-2026-000001",
      signerEmail: "x@y.com",
      signerName: "Juan",
      pdfBase64: "JVBE",
    })
    expect(r.ok).toBe(true)
    expect(r.stub).toBe(true)
    expect(r.signatureRequestId).toContain("stub_CTR-2026-000001")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("con API key envía POST al endpoint de Dropbox Sign", async () => {
    process.env.DROPBOX_SIGN_API_KEY = "test_key_123"
    vi.resetModules()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          signature_request: {
            signature_request_id: "sig_42",
            signing_url: "https://sign.example.com/x",
          },
        }),
        { status: 200 },
      ),
    )
    const { createSignatureRequest } = await import("@/server/integrations/dropbox-sign/client")
    const r = await createSignatureRequest({
      contractNumber: "CTR-2026-000002",
      signerEmail: "x@y.com",
      signerName: "Juan",
      pdfBase64: "JVBE",
    })
    expect(r.ok).toBe(true)
    expect(r.signatureRequestId).toBe("sig_42")
    expect(r.signingUrl).toBe("https://sign.example.com/x")
  })
})

describe("verifyWebhookSignature", () => {
  it("acepta cualquier firma cuando no hay API key (modo dev)", async () => {
    process.env.DROPBOX_SIGN_API_KEY = ""
    vi.resetModules()
    const { verifyWebhookSignature } = await import("@/server/integrations/dropbox-sign/client")
    expect(await verifyWebhookSignature("body", "anysig")).toBe(true)
  })

  it("rechaza firma incorrecta cuando hay API key", async () => {
    process.env.DROPBOX_SIGN_API_KEY = "shared_secret"
    vi.resetModules()
    const { verifyWebhookSignature } = await import("@/server/integrations/dropbox-sign/client")
    expect(await verifyWebhookSignature("body", "wrong")).toBe(false)
  })
})
