import { NextResponse } from "next/server"
import { printFilingPacket } from "@/features/filing/actions/print-packet"
import { isFilingError } from "@/features/filing/errors"
import { printPacketSchema } from "@/features/filing/schemas/packet-schema"
import { createServerClient } from "@/lib/supabase/server"

/**
 * POST /api/cases/[caseId]/filing/print
 *
 * Body: { scope: 'full_packet'|'intake_only'|'case_only'|'single_form'|'cover_sheet', formCode? }
 *
 * Devuelve el PDF generado como `application/pdf` con
 * `Content-Disposition: attachment; filename=...`.
 *
 * Tamaño máximo: ~12 MB (limitado por form-cache + pdf-lib). Generación cold:
 * < 8s; warm: < 3s.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = printPacketSchema.safeParse({ ...(body as Record<string, unknown>), caseId })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", detail: parsed.error.issues[0]?.message },
      { status: 400 },
    )
  }

  try {
    const result = await printFilingPacket({
      caseId,
      scope: parsed.data.scope,
      formCode: parsed.data.formCode ?? null,
    })

    return new Response(toBlob(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(result.bytes.byteLength),
        "X-Content-SHA256": result.sha256,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (err) {
    if (isFilingError(err)) {
      const status = err.code === "unauthorized" ? 401 : err.code === "case_not_found" ? 404 : 400
      return NextResponse.json({ error: err.code, context: err.context ?? null }, { status })
    }
    console.error("[filing/print]", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" })
}
