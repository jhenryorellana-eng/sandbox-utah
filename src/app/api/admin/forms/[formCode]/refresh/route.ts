import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance/wrap-with-compliance"
import { refreshForm } from "@/server/legal/utah-courts"

/**
 * POST /api/admin/forms/[formCode]/refresh
 *
 * Admin-only endpoint para forzar re-cache de un PDF oficial. Útil cuando
 * utcourts.gov publica una versión nueva. La auditoría queda en audit_log.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ formCode: string }> },
): Promise<Response> {
  const { formCode } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  if (!roleRow) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const result = await withCompliance(
    {
      userId: user.id,
      action: "filing.form.refresh",
      resourceType: "form",
      resourceId: formCode,
    },
    async () => refreshForm(formCode),
  )

  if (result.kind === "error") {
    return NextResponse.json(
      { error: result.reason, status: result.status ?? null },
      { status: 502 },
    )
  }

  if (result.kind === "deep_link") {
    return NextResponse.json({ kind: "deep_link", url: result.url, format: result.format })
  }

  return NextResponse.json({
    kind: "pdf",
    sha256: result.sha256,
    storagePath: result.storagePath,
    sizeBytes: result.bytes.byteLength,
    fromCache: result.fromCache,
  })
}
