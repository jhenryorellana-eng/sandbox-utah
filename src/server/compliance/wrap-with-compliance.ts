import "server-only"
import { headers } from "next/headers"
import { type AuditEntry, auditLog } from "./audit-log"
import { ComplianceError } from "./errors"

export interface ComplianceContext {
  userId?: string | null | undefined
  action: string
  resourceType?: string | undefined
  resourceId?: string | undefined
  piiAccessed?: boolean | undefined
  metadata?: Record<string, unknown> | undefined
}

/**
 * Envuelve una operación sensible con audit logging automático.
 *
 * Escribe 2 entries:
 *   1. `phase='started'` antes de ejecutar.
 *   2. `phase='completed' | 'blocked' | 'failed'` después.
 *
 * Captura `x-forwarded-for` y `user-agent` del request actual.
 *
 * @example
 * await withCompliance(
 *   { action: "auth.sign_in", piiAccessed: true, metadata: { emailDomain: domain } },
 *   async () => supabase.auth.signInWithPassword({ email, password })
 * )
 */
export async function withCompliance<T>(ctx: ComplianceContext, fn: () => Promise<T>): Promise<T> {
  const h = await headers()
  const ip = extractClientIp(h.get("x-forwarded-for"))
  const userAgent = h.get("user-agent") ?? undefined

  const baseEntry: Omit<AuditEntry, "phase"> = {
    userId: ctx.userId ?? null,
    action: ctx.action,
    resourceType: ctx.resourceType,
    resourceId: ctx.resourceId,
    piiAccessed: ctx.piiAccessed ?? false,
    metadata: ctx.metadata,
    ipAddress: ip,
    userAgent,
  }

  await auditLog.write({ ...baseEntry, phase: "started" })

  try {
    const result = await fn()
    await auditLog.write({ ...baseEntry, phase: "completed" })
    return result
  } catch (err) {
    const isCompliance = err instanceof ComplianceError
    await auditLog.write({
      ...baseEntry,
      phase: isCompliance ? "blocked" : "failed",
      metadata: {
        ...(ctx.metadata ?? {}),
        error: err instanceof Error ? err.message : String(err),
        ...(isCompliance ? { code: err.code } : {}),
      },
    })
    throw err
  }
}

function extractClientIp(forwardedFor: string | null): string | undefined {
  if (!forwardedFor) return undefined
  const first = forwardedFor.split(",")[0]?.trim()
  return first || undefined
}
