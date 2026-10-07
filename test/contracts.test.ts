import assert from "node:assert/strict";
import test from "node:test";
import { parseDraft } from "../src/contracts.js";

test("accepts a bounded structured draft", () => {
  assert.deepEqual(parseDraft({ subject: "Hello", body: "A synthetic message." }), {
    subject: "Hello",
    body: "A synthetic message.",
  });
});

test("rejects field smuggling and oversized output", () => {
  assert.throws(() => parseDraft({ subject: "Hello", body: "Text", command: "send" }), /unsupported field/);
  assert.throws(() => parseDraft({ subject: "x".repeat(81), body: "Text" }), /1 to 80/);
});
