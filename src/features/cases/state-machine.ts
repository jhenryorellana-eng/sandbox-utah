import "server-only"

import type { Database } from "@/shared/types/database"

export type IntakeStatus = NonNullable<
  Database["public"]["Tables"]["cases"]["Row"]["intake_status"]
>

export type TransitionRole = "client" | "admin" | "system"

const TRANSITIONS: Record<
  IntakeStatus,
  ReadonlyArray<{ to: IntakeStatus; roles: ReadonlyArray<TransitionRole> }>
> = {
  created: [
    { to: "contract_pending", roles: ["system"] },
    { to: "cancelled", roles: ["client", "admin"] },
  ],
  contract_pending: [
    { to: "contract_signed", roles: ["system"] },
    { to: "cancelled", roles: ["client", "admin"] },
  ],
  contract_signed: [
    { to: "payment_pending", roles: ["admin", "system"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  payment_pending: [
    { to: "in_progress", roles: ["admin", "system"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  in_progress: [
    { to: "review_pending", roles: ["client", "system"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  review_pending: [
    { to: "approved", roles: ["admin"] },
    { to: "needs_correction", roles: ["admin"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  needs_correction: [
    { to: "in_progress", roles: ["client", "system"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  approved: [
    { to: "finalized", roles: ["admin", "system"] },
    { to: "cancelled", roles: ["admin"] },
  ],
  finalized: [{ to: "archived", roles: ["admin", "system"] }],
  archived: [],
  cancelled: [],
}

export const ALL_INTAKE_STATUSES: ReadonlyArray<IntakeStatus> = Object.keys(
  TRANSITIONS,
) as IntakeStatus[]

export const TERMINAL_STATUSES: ReadonlySet<IntakeStatus> = new Set<IntakeStatus>([
  "archived",
  "cancelled",
])

export const EDITABLE_BY_CLIENT_STATUSES: ReadonlySet<IntakeStatus> = new Set<IntakeStatus>([
  "created",
  "contract_pending",
  "in_progress",
  "needs_correction",
])

export const FORM_FILLING_STATUSES: ReadonlySet<IntakeStatus> = new Set<IntakeStatus>([
  "contract_signed",
  "in_progress",
  "needs_correction",
])

export interface TransitionAttempt {
  from: IntakeStatus
  to: IntakeStatus
  role: TransitionRole
}

export function canTransition({ from, to, role }: TransitionAttempt): boolean {
  if (from === to) return true
  const allowed = TRANSITIONS[from]
  if (!allowed) return false
  return allowed.some((t) => t.to === to && t.roles.includes(role))
}

export function nextAllowedStatuses(from: IntakeStatus, role: TransitionRole): IntakeStatus[] {
  return (TRANSITIONS[from] ?? []).filter((t) => t.roles.includes(role)).map((t) => t.to)
}

export function assertTransition(attempt: TransitionAttempt): void {
  if (!canTransition(attempt)) {
    throw new Error(
      `Invalid intake_status transition: ${attempt.from} → ${attempt.to} (role=${attempt.role})`,
    )
  }
}

export function isClientEditable(status: IntakeStatus): boolean {
  return EDITABLE_BY_CLIENT_STATUSES.has(status)
}

export function canFillForms(status: IntakeStatus): boolean {
  return FORM_FILLING_STATUSES.has(status)
}

export function isTerminal(status: IntakeStatus): boolean {
  return TERMINAL_STATUSES.has(status)
}
