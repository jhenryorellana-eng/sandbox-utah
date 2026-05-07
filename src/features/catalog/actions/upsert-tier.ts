"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const upsertSchema = z.object({
  id: z.string().uuid().nullish(),
  service_id: z.string().uuid(),
  beneficiaries_count: z.number().int().min(1).max(20),
  price_cents: z.number().int().min(0),
  label_es: z.string().min(2).max(120),
  label_en: z.string().min(2).max(120),
  description_es: z.string().max(500).nullish(),
  description_en: z.string().max(500).nullish(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

export interface UpsertTierResult {
  ok: boolean
  tierId?: string
  errorCode?: "auth" | "not_admin" | "validation" | "duplicate_count" | "generic"
  errorMessage?: string
}

async function requireAdminId(): Promise<string | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()
  return data ? user.id : null
}

export async function upsertTierAction(input: unknown): Promise<UpsertTierResult> {
  const parsed = upsertSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", errorMessage: parsed.error.message }
  }
  const adminId = await requireAdminId()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: parsed.data.id ? "service_tier.updated" : "service_tier.created",
      resourceType: "service_tiers",
      userId: adminId,
      metadata: {
        serviceId: parsed.data.service_id,
        beneficiariesCount: parsed.data.beneficiaries_count,
        priceCents: parsed.data.price_cents,
      },
    },
    async (): Promise<UpsertTierResult> => {
      const service = createServiceClient()
      const payload = {
        service_id: parsed.data.service_id,
        beneficiaries_count: parsed.data.beneficiaries_count,
        price_cents: parsed.data.price_cents,
        label_es: parsed.data.label_es,
        label_en: parsed.data.label_en,
        description_es: parsed.data.description_es ?? null,
        description_en: parsed.data.description_en ?? null,
        display_order: parsed.data.display_order,
        is_active: parsed.data.is_active,
      }

      let tierId = parsed.data.id ?? null
      if (tierId) {
        const { error } = await service.from("service_tiers").update(payload).eq("id", tierId)
        if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }
      } else {
        const { data, error } = await service
          .from("service_tiers")
          .insert(payload)
          .select("id")
          .single()
        if (error || !data) {
          if (error?.code === "23505") return { ok: false, errorCode: "duplicate_count" }
          return { ok: false, errorCode: "generic", errorMessage: error?.message }
        }
        tierId = data.id
      }

      revalidatePath("/[locale]/admin/catalog", "page")
      revalidatePath("/[locale]/cases/new", "page")
      return { ok: true, tierId: tierId ?? undefined }
    },
  )
}

export async function setTierActiveAction(input: {
  id: string
  isActive: boolean
}): Promise<{ ok: boolean; errorCode?: string }> {
  const schema = z.object({ id: z.string().uuid(), isActive: z.boolean() })
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }
  const adminId = await requireAdminId()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: parsed.data.isActive ? "service_tier.activated" : "service_tier.deactivated",
      resourceType: "service_tiers",
      userId: adminId,
      resourceId: parsed.data.id,
    },
    async () => {
      const service = createServiceClient()
      const { error } = await service
        .from("service_tiers")
        .update({ is_active: parsed.data.isActive })
        .eq("id", parsed.data.id)
      if (error) return { ok: false, errorCode: "generic" }
      revalidatePath("/[locale]/admin/catalog", "page")
      return { ok: true }
    },
  )
}

export async function deleteTierAction(input: {
  id: string
}): Promise<{ ok: boolean; errorCode?: string }> {
  const schema = z.object({ id: z.string().uuid() })
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }
  const adminId = await requireAdminId()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: "service_tier.deleted",
      resourceType: "service_tiers",
      userId: adminId,
      resourceId: parsed.data.id,
    },
    async () => {
      const service = createServiceClient()
      // Solo eliminar si NO está referenciado por casos. Caso contrario, deactivar.
      const { count } = await service
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("service_tier_id", parsed.data.id)
      if ((count ?? 0) > 0) {
        const { error: deactErr } = await service
          .from("service_tiers")
          .update({ is_active: false })
          .eq("id", parsed.data.id)
        if (deactErr) return { ok: false, errorCode: "generic" }
        revalidatePath("/[locale]/admin/catalog", "page")
        return { ok: true }
      }
      const { error } = await service.from("service_tiers").delete().eq("id", parsed.data.id)
      if (error) return { ok: false, errorCode: "generic" }
      revalidatePath("/[locale]/admin/catalog", "page")
      return { ok: true }
    },
  )
}
