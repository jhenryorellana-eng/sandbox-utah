import "server-only"
import type { ZodTypeAny } from "zod"
import type { IntakeStatus } from "@/shared/types/database"

export interface WorkflowField {
  id: string
  type: "text" | "date" | "tel" | "email" | "select" | "textarea" | "checkbox" | "number"
  labelEs: string
  labelEn: string
  hintEs?: string
  hintEn?: string
  required?: boolean
  options?: { value: string; labelEs: string; labelEn: string }[]
  placeholder?: string
}

export interface WorkflowStep<TFormData = Record<string, unknown>> {
  id: string
  titleEs: string
  titleEn: string
  descriptionEs?: string
  descriptionEn?: string
  fields: WorkflowField[]
  schema: ZodTypeAny
  visibleWhen?: (data: Partial<TFormData>) => boolean
}

export interface WorkflowDefinition<TFormData = Record<string, unknown>> {
  slug: string
  steps: WorkflowStep<TFormData>[]
  formSchema: ZodTypeAny
  pdfTemplate: string
  /** Placeholder de campos legales obligatorios — Sprint 7+ usará PDF-lib field map. */
  pdfFieldMap?: Record<string, string>
}

// ============================================================================
// State machine de intake_status
// ============================================================================
export const ALLOWED_TRANSITIONS: Record<IntakeStatus, IntakeStatus[]> = {
  created: ["contract_pending", "cancelled"],
  contract_pending: ["contract_signed", "cancelled"],
  contract_signed: ["payment_pending", "cancelled"],
  payment_pending: ["in_progress", "cancelled"],
  in_progress: ["review_pending", "cancelled"],
  review_pending: ["approved", "needs_correction", "cancelled"],
  needs_correction: ["in_progress", "cancelled"],
  approved: ["finalized", "needs_correction"],
  finalized: ["archived"],
  archived: [],
  cancelled: [],
}

export function canTransition(from: IntakeStatus, to: IntakeStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export function assertTransition(from: IntakeStatus, to: IntakeStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid intake transition: ${from} → ${to}`)
  }
}

// ============================================================================
// Workflow registry
// ============================================================================
const registry = new Map<string, WorkflowDefinition>()

export function registerWorkflow<T>(def: WorkflowDefinition<T>): void {
  if (registry.has(def.slug)) {
    throw new Error(`Workflow already registered: ${def.slug}`)
  }
  registry.set(def.slug, def as WorkflowDefinition)
}

export function getWorkflow(slug: string): WorkflowDefinition | null {
  return registry.get(slug) ?? null
}

export function listWorkflowSlugs(): string[] {
  return [...registry.keys()].sort()
}

// ============================================================================
// Helpers
// ============================================================================
export function nextStepId<T>(
  workflow: WorkflowDefinition<T>,
  current: string,
  data: Partial<T>,
): string | null {
  const idx = workflow.steps.findIndex((s) => s.id === current)
  if (idx < 0) return null
  for (let i = idx + 1; i < workflow.steps.length; i++) {
    const step = workflow.steps[i]
    if (!step) continue
    if (!step.visibleWhen || step.visibleWhen(data)) return step.id
  }
  return null
}

export function prevStepId<T>(
  workflow: WorkflowDefinition<T>,
  current: string,
  data: Partial<T>,
): string | null {
  const idx = workflow.steps.findIndex((s) => s.id === current)
  if (idx <= 0) return null
  for (let i = idx - 1; i >= 0; i--) {
    const step = workflow.steps[i]
    if (!step) continue
    if (!step.visibleWhen || step.visibleWhen(data)) return step.id
  }
  return null
}

export function isWorkflowComplete<T>(
  workflow: WorkflowDefinition<T>,
  data: Partial<T>,
  completedSteps: string[],
): boolean {
  const visibleSteps = workflow.steps.filter((s) => !s.visibleWhen || s.visibleWhen(data))
  return visibleSteps.every((s) => completedSteps.includes(s.id))
}
