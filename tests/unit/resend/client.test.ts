import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const originalKey = process.env.RESEND_API_KEY

describe("sendEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    if (originalKey === undefined) {
      process.env.RESEND_API_KEY = ""
    } else {
      process.env.RESEND_API_KEY = originalKey
    }
  })

  it("sin RESEND_API_KEY hace dry-run sin lanzar fetch", async () => {
    process.env.RESEND_API_KEY = ""
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { sendEmail } = await import("@/server/integrations/resend/client")
    const r = await sendEmail({ to: "x@y.com", subject: "test", html: "<p>hi</p>" })
    expect(r.ok).toBe(true)
    expect(r.dryRun).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("con key envía POST a https://api.resend.com/emails", async () => {
    process.env.RESEND_API_KEY = "re_test_123"
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "msg_42" }), { status: 200 }))
    vi.resetModules()
    const { sendEmail } = await import("@/server/integrations/resend/client")
    const r = await sendEmail({ to: "x@y.com", subject: "Hi", html: "<p>hi</p>" })
    expect(r.ok).toBe(true)
    expect(r.id).toBe("msg_42")
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] ?? []
    expect(url).toBe("https://api.resend.com/emails")
    expect((init as RequestInit).method).toBe("POST")
  })
})
