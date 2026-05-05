import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AuditEntry } from "@/server/compliance/audit-log"

const writeMock = vi.fn<(entry: AuditEntry) => Promise<void>>(async () => {})

vi.mock("next/headers", () => ({
  headers: async () =>
    new Map<string, string>([
      ["x-forwarded-for", "203.0.113.42, 10.0.0.1"],
      ["user-agent", "vitest"],
    ]) as unknown as Headers,
}))

vi.mock("@/server/compliance/audit-log", () => ({
  auditLog: { write: writeMock },
  maskEmail: (e: string) => `***@${e.split("@")[1]}`,
}))

const { withCompliance } = await import("@/server/compliance/wrap-with-compliance")
const { ComplianceError } = await import("@/server/compliance/errors")

describe("withCompliance", () => {
  beforeEach(() => {
    writeMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("escribe phase=started antes y phase=completed después en happy path", async () => {
    const result = await withCompliance(
      { action: "test.action", userId: "user-1", piiAccessed: true },
      async () => "OK",
    )

    expect(result).toBe("OK")
    expect(writeMock).toHaveBeenCalledTimes(2)
    expect(writeMock.mock.calls[0]?.[0]).toMatchObject({
      action: "test.action",
      userId: "user-1",
      piiAccessed: true,
      phase: "started",
      ipAddress: "203.0.113.42",
      userAgent: "vitest",
    })
    expect(writeMock.mock.calls[1]?.[0]).toMatchObject({
      action: "test.action",
      phase: "completed",
    })
  })

  it("escribe phase=blocked cuando se lanza ComplianceError", async () => {
    const promise = withCompliance({ action: "test.blocked" }, async () => {
      throw new ComplianceError("rate limit hit", "rate_limited")
    })
    await expect(promise).rejects.toBeInstanceOf(ComplianceError)
    expect(writeMock).toHaveBeenCalledTimes(2)
    expect(writeMock.mock.calls[1]?.[0]).toMatchObject({
      phase: "blocked",
      metadata: expect.objectContaining({ code: "rate_limited" }),
    })
  })

  it("escribe phase=failed cuando se lanza un Error genérico", async () => {
    const promise = withCompliance({ action: "test.failed" }, async () => {
      throw new Error("kaboom")
    })
    await expect(promise).rejects.toThrow("kaboom")
    expect(writeMock).toHaveBeenCalledTimes(2)
    expect(writeMock.mock.calls[1]?.[0]).toMatchObject({ phase: "failed" })
    expect(writeMock.mock.calls[1]?.[0].metadata).toMatchObject({ error: "kaboom" })
  })

  it("extrae solo la primera IP del header x-forwarded-for", async () => {
    await withCompliance({ action: "test.ip" }, async () => "ok")
    const startedCall = writeMock.mock.calls[0]?.[0]
    expect(startedCall?.ipAddress).toBe("203.0.113.42")
  })

  it("propaga metadata del context al started entry", async () => {
    await withCompliance({ action: "test.meta", metadata: { foo: "bar", n: 7 } }, async () => "ok")
    expect(writeMock.mock.calls[0]?.[0].metadata).toEqual({ foo: "bar", n: 7 })
  })
})
