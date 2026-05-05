import "server-only"

// Importar para registrarlos en el registry global del engine.
import "./uncontested-divorce"
import "./eviction-defense"
import "./llc-formation"

export type { WorkflowDefinition, WorkflowField, WorkflowStep } from "./_engine"
export {
  ALLOWED_TRANSITIONS,
  assertTransition,
  canTransition,
  getWorkflow,
  isWorkflowComplete,
  listWorkflowSlugs,
  nextStepId,
  prevStepId,
  registerWorkflow,
} from "./_engine"
