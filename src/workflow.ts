export type Stage = "queued" | "context_ready" | "draft_validated" | "approved" | "complete" | "failed";
export type WorkflowEvent = "BUILD_CONTEXT" | "VALIDATE_DRAFT" | "APPROVE" | "COMMIT" | "REJECT";

export type WorkflowState = Readonly<{
  workflowRef: string;
  stage: Stage;
  attempt: number;
  version: 1;
}>;

const transitions: Readonly<Record<Stage, Partial<Record<WorkflowEvent, Stage>>>> = {
  queued: { BUILD_CONTEXT: "context_ready", REJECT: "failed" },
  context_ready: { VALIDATE_DRAFT: "draft_validated", REJECT: "failed" },
  draft_validated: { APPROVE: "approved", REJECT: "failed" },
  approved: { COMMIT: "complete", REJECT: "failed" },
  complete: {},
  failed: {},
};

export function transition(state: WorkflowState, event: WorkflowEvent): WorkflowState {
  const nextStage = transitions[state.stage][event];
  if (!nextStage) throw new Error(`Event ${event} is not allowed from ${state.stage}`);
  return Object.freeze({ ...state, stage: nextStage });
}

export function idempotencyKey(state: WorkflowState, operation: string): string {
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(operation)) throw new Error("Invalid operation name");
  return `${state.workflowRef}:v${state.version}:${operation}`;
}
