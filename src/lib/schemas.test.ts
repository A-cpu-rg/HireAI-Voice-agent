import { describe, it, expect } from "vitest";
import {
  loginSchema,
  createCandidateSchema,
  bulkCallSchema,
  listCandidatesSchema,
} from "./schemas";
import { MAX_BULK_CALL_BATCH } from "./constants";

describe("loginSchema", () => {
  it("normalises email to lowercase", () => {
    const parsed = loginSchema.parse({ email: "  User@Example.COM ", password: "x" });
    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("createCandidateSchema", () => {
  it("applies defaults for optional fields", () => {
    const parsed = createCandidateSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "Engineer",
    });
    expect(parsed.phone).toBe("");
    expect(parsed.location).toBe("Remote");
    expect(parsed.experience).toBe(0);
  });

  it("rejects a non-uuid jobId", () => {
    const result = createCandidateSchema.safeParse({
      name: "A",
      email: "a@b.com",
      role: "Eng",
      jobId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkCallSchema", () => {
  it("rejects an empty list", () => {
    expect(bulkCallSchema.safeParse({ candidateIds: [] }).success).toBe(false);
  });

  it("rejects a batch over the cap", () => {
    const ids = Array.from(
      { length: MAX_BULK_CALL_BATCH + 1 },
      () => "00000000-0000-4000-8000-000000000000"
    );
    expect(bulkCallSchema.safeParse({ candidateIds: ids }).success).toBe(false);
  });
});

describe("listCandidatesSchema", () => {
  it("coerces pagination query strings and applies defaults", () => {
    const parsed = listCandidatesSchema.parse({ page: "3", pageSize: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
    expect(parsed.sortBy).toBe("appliedAt");
    expect(parsed.sortOrder).toBe("desc");
  });

  it("caps pageSize at the maximum", () => {
    expect(listCandidatesSchema.safeParse({ pageSize: "9999" }).success).toBe(false);
  });
});
