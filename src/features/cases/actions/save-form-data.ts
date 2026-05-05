"use server"

import { z } from "zod"
import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { withCompliance } from "@/server/compliance"
import { getWorkflow } from "@/server/workflows"
import { assertTransition } from "@/server/workflows/_engine"
import type { Json } from "@/shared/types/database"
import { appendCaseActivity } from "../repository"

const inputSchema = z.object({
  caseId: z.string().uuid(),
  stepId: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  markComplete: z.boolean().default(false),
})

export interface SaveFormDataResult {
  ok: boolean
  errorCode?: "auth" | "not_found" | "validation" | "wrong_status" | "generic"
  errorMessage?: string
  fieldErrors?: Record<string, string>
}

const ALLOWED_INTAKE_FOR_EDIT = ["payment_pending", "in_progress", "needs_correction"] as const

export async function saveFormDataAction(input: unknown): Promise<SaveFormDataResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errorCode: "validation" }
  const { caseId, stepId, data, markComplete } = parsed.data

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, client_id, service_id, intake_status, form_data, completed_steps")
    .eq("id", caseId)
    .eq("client_id", user.id)
    .maybeSingle()
  if (!caseRow) return { ok: false, errorCode: "not_found" }

  if (
    !ALLOWED_INTAKE_FOR_EDIT.includes(
      caseRow.intake_status as (typeof ALLOWED_INTAKE_FOR_EDIT)[number],
    )
  ) {
    return { ok: false, errorCode: "wrong_status" }
  }

  const { data: service } = await supabase
    .from("services")
    .select("workflow_slug")
    .eq("id", caseRow.service_id)
    .single()
  if (!service) return { ok: false, errorCode: "not_found" }

  const workflow = getWorkflow(service.workflow_slug)
  if (!workflow) return { ok: false, errorCode: "not_found" }
  const step = workflow.steps.find((s) => s.id === stepId)
  if (!step) return { ok: false, errorCode: "not_found" }

  const validation = step.schema.safeParse(data)
  const fieldErrors: Record<string, string> = {}
  if (!validation.success) {
    if (markComplete) {
      for (const issue of validation.error.issues) {
        const path = issue.path.join(".")
        fieldErrors[path] = issue.message
      }
      return { ok: false, errorCode: "validation", fieldErrors }
    }
    // Auto-save tolerante: guarda parcial sin validar.
  }

  return withCompliance(
    {
      action: "case.form_data_saved",
      resourceType: "cases",
      resourceId: caseId,
      userId: user.id,
      metadata: { stepId, markComplete },
    },
    async (): Promise<SaveFormDataResult> => {
      const mergedFormData = {
        ...((caseRow.form_data ?? {}) as Record<string, unknown>),
        ...(data as Record<string, unknown>),
      }

      const completedSet = new Set(caseRow.completed_steps ?? [])
      if (markComplete) completedSet.add(stepId)

      // Promover intake a in_progress en el primer save de un caso post-pago
      const newIntake =
        caseRow.intake_status === "payment_pending" ? "in_progress" : caseRow.intake_status
      if (newIntake !== caseRow.intake_status) {
        try {
          assertTransition(caseRow.intake_status, newIntake)
        } catch (err) {
          return {
            ok: false,
            errorCode: "wrong_status",
            errorMessage: err instanceof Error ? err.message : "transition",
          }
        }
      }

      const { error } = await supabase
        .from("cases")
        .update({
          form_data: mergedFormData as Json,
          current_step: stepId,
          completed_steps: [...completedSet],
          intake_status: newIntake,
        })
        .eq("id", caseId)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      if (markComplete) {
        await appendCaseActivity({
          caseId,
          actorId: user.id,
          actorType: "client",
          activityType: "case.step_completed",
          description: `Step ${stepId} completed`,
          metadata: { stepId },
        })
      }

      return { ok: true }
    },
  )
}

export async function submitForReviewAction(caseId: string): Promise<SaveFormDataResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, errorCode: "auth" }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("intake_status")
    .eq("id", caseId)
    .eq("client_id", user.id)
    .maybeSingle()
  if (!caseRow) return { ok: false, errorCode: "not_found" }

  if (caseRow.intake_status !== "in_progress" && caseRow.intake_status !== "needs_correction") {
    return { ok: false, errorCode: "wrong_status" }
  }

  return withCompliance(
    {
      action: "case.submitted_for_review",
      resourceType: "cases",
      resourceId: caseId,
      userId: user.id,
    },
    async (): Promise<SaveFormDataResult> => {
      try {
        assertTransition(caseRow.intake_status, "review_pending")
      } catch {
        return { ok: false, errorCode: "wrong_status" }
      }
      const service = createServiceClient()
      const { error } = await service
        .from("cases")
        .update({ intake_status: "review_pending" })
        .eq("id", caseId)
      if (error) return { ok: false, errorCode: "generic", errorMessage: error.message }

      await appendCaseActivity({
        caseId,
        actorId: user.id,
        actorType: "client",
        activityType: "case.submitted_for_review",
        description: "Cliente envió el caso a revisión QA",
      })
      return { ok: true }
    },
  )
}
