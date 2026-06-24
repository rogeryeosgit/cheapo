import { describe, expect, it } from "vitest";
import { cacheSizeForTests, clearCacheForTests, getCached, setCached } from "../cache";

describe("search cache", () => {
  it("keeps a bounded number of entries", () => {
    clearCacheForTests();

    for (let index = 0; index < 501; index += 1) {
      setCached(`key-${index}`, index, 60_000);
    }

    expect(cacheSizeForTests()).toBe(500);
    expect(getCached("key-0")).toBeNull();
    expect(getCached("key-500")).toBe(500);
  });
});
