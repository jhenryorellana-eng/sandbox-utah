import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getOrCreatePacket } from "@/server/legal/utah-courts"

/**
 * GET /api/cases/[caseId]/filing — devuelve el packet existente (no regenera).
 * Si no existe, devuelve 404 — la UI debe llamar al server action de generate.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await getOrCreatePacket({ caseId }, { allowCreate: false })
  if (!result.ok) {
    if (result.error.kind === "case_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    if (result.error.kind === "address_unresolved") {
      return NextResponse.json({ error: "no_packet" }, { status: 404 })
    }
    return NextResponse.json({ error: result.error.kind }, { status: 400 })
  }

  return NextResponse.json({ packet: result.packet })
}
