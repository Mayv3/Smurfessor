import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, clearNamespace } from "../../src/lib/cache";

describe("Server cache (lru-cache)", () => {
  beforeEach(() => {
    clearNamespace("test");
  });

  it("stores and retrieves a value", () => {
    setCached("test", "k1", { hello: "world" }, 60_000);
    const result = getCached<{ hello: string }>("test", "k1", 60_000);
    expect(result).toEqual({ hello: "world" });
  });

  it("returns undefined for missing keys", () => {
    const result = getCached("test", "nope", 60_000);
    expect(result).toBeUndefined();
  });

  it("clears a namespace", () => {
    setCached("test", "k1", "val1", 60_000);
    setCached("test", "k2", "val2", 60_000);
    clearNamespace("test");
    expect(getCached("test", "k1", 60_000)).toBeUndefined();
    expect(getCached("test", "k2", 60_000)).toBeUndefined();
  });

  it("stores different types", () => {
    setCached("test", "str", "hello", 60_000);
    setCached("test", "num", 42, 60_000);
    setCached("test", "arr", [1, 2, 3], 60_000);

    expect(getCached<string>("test", "str", 60_000)).toBe("hello");
    expect(getCached<number>("test", "num", 60_000)).toBe(42);
    expect(getCached<number[]>("test", "arr", 60_000)).toEqual([1, 2, 3]);
  });

  it("keeps separate namespaces isolated", () => {
    setCached("ns-a", "key", "A", 60_000);
    setCached("ns-b", "key", "B", 60_000);

    expect(getCached<string>("ns-a", "key", 60_000)).toBe("A");
    expect(getCached<string>("ns-b", "key", 60_000)).toBe("B");

    clearNamespace("ns-a");
    expect(getCached<string>("ns-a", "key", 60_000)).toBeUndefined();
    expect(getCached<string>("ns-b", "key", 60_000)).toBe("B");

    // cleanup
    clearNamespace("ns-b");
  });
});
