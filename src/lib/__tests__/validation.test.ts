import { describe, expect, it } from "vitest";
import { isValidQuery, MAX_QUERY_LENGTH, normalizeQuery } from "../validation";

describe("search validation", () => {
  it("normalizes whitespace and bounds query length", () => {
    expect(normalizeQuery("  Meiji   Low   Fat Milk  ")).toBe("Meiji Low Fat Milk");
    expect(isValidQuery("m")).toBe(false);
    expect(isValidQuery("Meiji Low Fat Milk")).toBe(true);
    expect(isValidQuery("x".repeat(MAX_QUERY_LENGTH + 1))).toBe(false);
  });
});
