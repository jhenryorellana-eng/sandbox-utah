import { type NextRequest, NextResponse } from "next/server"
import { createSignedUrlForDocument } from "@/features/documents/repository"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, client_id")
    .eq("id", id)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // RLS adicional: sólo dueño o admin (admin se valida vía has_role)
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  const isAdmin = !!roles
  if (!isAdmin && doc.client_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = await createSignedUrlForDocument(doc.storage_path, 60)
  if (!url) return NextResponse.json({ error: "signing_failed" }, { status: 500 })
  return NextResponse.redirect(url)
}
