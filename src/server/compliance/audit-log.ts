import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/shared/types/database"

type Phase = "started" | "completed" | "blocked" | "failed"

export interface AuditEntry {
  userId?: string | null | undefined
  action: string
  resourceType?: string | undefined
  resourceId?: string | undefined
  ipAddress?: string | undefined
  userAgent?: string | undefined
  piiAccessed?: boolean | undefined
  phase: Phase
  metadata?: Record<string, unknown> | undefined
}

let cachedClient: ReturnType<typeof createClient<Database>> | null = null

function getClient() {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("[audit_log] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  cachedClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Enmascara un email a su dominio: "henry@example.com" → "***@example.com".
 * Usar cuando se loguee email para evitar PII en metadata.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@")
  if (at <= 0) return "***"
  return `***@${email.slice(at + 1)}`
}

export const auditLog = {
  async write(entry: AuditEntry): Promise<void> {
    try {
      const insertRow = {
        user_id: entry.userId ?? null,
        action: entry.action,
        resource_type: entry.resourceType ?? null,
        resource_id: entry.resourceId ?? null,
        ip_address: entry.ipAddress ?? null,
        user_agent: entry.userAgent ?? null,
        pii_accessed: entry.piiAccessed ?? false,
        phase: entry.phase,
        metadata: (entry.metadata ?? {}) as Json,
      }

      const { error } = await getClient().from("audit_log").insert(insertRow)
      if (error) {
        console.error("[audit_log] write failed:", error.message)
      }
    } catch (err) {
      console.error("[audit_log] unexpected error:", err)
    }
  },
}
