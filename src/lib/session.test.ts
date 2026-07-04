import { describe, it, expect } from "vitest";
import { encodeSession, decodeSession, hashPassword, verifyPassword } from "./session";

describe("session tokens", () => {
  it("round-trips a valid session", () => {
    const token = encodeSession("user-123");
    expect(decodeSession(token)).toBe("user-123");
  });

  it("rejects a tampered signature", () => {
    const token = encodeSession("user-123");
    const tampered = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");
    expect(decodeSession(tampered)).toBeNull();
  });

  it("rejects a forged user id under the same signature", () => {
    const [, exp, nonce, sig] = encodeSession("user-123").split(".");
    expect(decodeSession(`attacker.${exp}.${nonce}.${sig}`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = encodeSession("user-123", -10);
    expect(decodeSession(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(decodeSession("")).toBeNull();
    expect(decodeSession("a.b.c")).toBeNull();
    expect(decodeSession("a.b.c.d.e")).toBeNull();
  });
});

describe("password hashing", () => {
  it("verifies the correct password", () => {
    const hash = hashPassword("s3cur3-passw0rd");
    expect(verifyPassword("s3cur3-passw0rd", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashPassword("s3cur3-passw0rd");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces a unique salt per hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects a malformed hash", () => {
    expect(verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
