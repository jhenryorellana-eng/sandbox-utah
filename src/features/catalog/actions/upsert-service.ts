"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"

const upsertSchema = z.object({
  id: z.string().uuid().nullish(),
  category_id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "slug debe ser kebab-case"),
  name_es: z.string().min(2).max(120),
  name_en: z.string().min(2).max(120),
  short_description_es: z.string().min(4).max(280),
  short_description_en: z.string().min(4).max(280),
  long_description_es: z.string().max(2000).nullish(),
  long_description_en: z.string().max(2000).nullish(),
  base_price_cents: z.number().int().min(0),
  estimated_duration_minutes: z.number().int().positive().nullish(),
  workflow_slug: z.string().min(2),
  beneficiary_label_es: z.string().max(80).nullish(),
  beneficiary_label_en: z.string().max(80).nullish(),
  allows_multiple_beneficiaries: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
})

export interface UpsertServiceResult {
  ok: boolean
  serviceId?: string
  errorCode?: "auth" | "not_admin" | "validation" | "slug_taken" | "generic"
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

export async function upsertServiceAction(input: unknown): Promise<UpsertServiceResult> {
  const parsed = upsertSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", errorMessage: parsed.error.message }
  }
  const adminId = await requireAdminId()
  if (!adminId) return { ok: false, errorCode: "not_admin" }

  return withCompliance(
    {
      action: parsed.data.id ? "service.updated" : "service.created",
      resourceType: "services",
      userId: adminId,
      metadata: { slug: parsed.data.slug, hasTiers: parsed.data.allows_multiple_beneficiaries },
    },
    async (): Promise<UpsertServiceResult> => {
      const service = createServiceClient()
      const payload = {
        category_id: parsed.data.category_id,
        slug: parsed.data.slug,
        name_es: parsed.data.name_es,
        name_en: parsed.data.name_en,
        short_description_es: parsed.data.short_description_es,
        short_description_en: parsed.data.short_description_en,
        long_description_es: parsed.data.long_description_es ?? null,
        long_description_en: parsed.data.long_description_en ?? null,
        base_price_cents: parsed.data.base_price_cents,
        estimated_duration_minutes: parsed.data.estimated_duration_minutes ?? null,
        workflow_slug: parsed.data.workflow_slug,
        beneficiary_label_es: parsed.data.beneficiary_label_es ?? null,
        beneficiary_label_en: parsed.data.beneficiary_label_en ?? null,
        allows_multiple_beneficiaries: parsed.data.allows_multiple_beneficiaries,
        is_active: parsed.data.is_active,
        display_order: parsed.data.display_order,
      }

      let serviceId = parsed.data.id ?? null
      if (serviceId) {
        const { error } = await service.from("services").update(payload).eq("id", serviceId)
        if (error) {
          return { ok: false, errorCode: "generic", errorMessage: error.message }
        }
      } else {
        const { data, error } = await service.from("services").insert(payload).select("id").single()
        if (error || !data) {
          if (error?.code === "23505") {
            return { ok: false, errorCode: "slug_taken" }
          }
          return { ok: false, errorCode: "generic", errorMessage: error?.message }
        }
        serviceId = data.id
      }

      revalidatePath("/[locale]/admin/catalog", "page")
      revalidatePath("/[locale]/cases/new", "page")
      return { ok: true, serviceId: serviceId ?? undefined }
    },
  )
}

export async function setServiceActiveAction(input: {
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
      action: parsed.data.isActive ? "service.activated" : "service.deactivated",
      resourceType: "services",
      userId: adminId,
      resourceId: parsed.data.id,
    },
    async () => {
      const service = createServiceClient()
      const { error } = await service
        .from("services")
        .update({ is_active: parsed.data.isActive })
        .eq("id", parsed.data.id)
      if (error) return { ok: false, errorCode: "generic" }
      revalidatePath("/[locale]/admin/catalog", "page")
      return { ok: true }
    },
  )
}
