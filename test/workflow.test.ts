import assert from "node:assert/strict";
import test from "node:test";
import { idempotencyKey, transition, type WorkflowState } from "../src/workflow.js";

const initial: WorkflowState = { workflowRef: "workflow-demo-001", stage: "queued", attempt: 0, version: 1 };

test("advances only through declared transitions", () => {
  const ready = transition(initial, "BUILD_CONTEXT");
  assert.equal(ready.stage, "context_ready");
  assert.throws(() => transition(ready, "COMMIT"), /not allowed/);
});

test("derives a stable idempotency key", () => {
  assert.equal(idempotencyKey(initial, "build-context"), "workflow-demo-001:v1:build-context");
});
