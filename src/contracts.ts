import type { LabelledContext } from "./context.js";

export type Draft = Readonly<{
  subject: string;
  body: string;
}>;

export interface AIProvider {
  generate(context: LabelledContext): Promise<unknown>;
}

const allowedKeys = new Set(["subject", "body"]);

export function parseDraft(value: unknown): Draft {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Draft must be an object");
  }

  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw new Error("Draft contains an unsupported field");
  }

  if (typeof record.subject !== "string" || typeof record.body !== "string") {
    throw new Error("Draft fields must be strings");
  }

  const subject = record.subject.trim();
  const body = record.body.trim();
  if (subject.length < 1 || subject.length > 80) {
    throw new Error("Subject must contain 1 to 80 characters");
  }
  if (body.length < 1 || body.length > 800) {
    throw new Error("Body must contain 1 to 800 characters");
  }

  return Object.freeze({ subject, body });
}
