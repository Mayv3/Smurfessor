import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiotApiError, RiotErrorCode } from "../../src/lib/riot/errors";

/**
 * These tests validate the error model used across all Riot API calls.
 * Integration tests for the actual HTTP wrapper (riotFetch) would
 * require mocking Bottleneck + global fetch; they're structured here
 * as unit tests on the error types and a simulated retry scenario.
 */

describe("RiotApiError", () => {
  it("has correct properties", () => {
    const err = new RiotApiError(
      429,
      "/some/endpoint",
      RiotErrorCode.RATE_LIMITED,
      "Rate limited",
    );

    expect(err.status).toBe(429);
    expect(err.endpoint).toBe("/some/endpoint");
    expect(err.code).toBe(RiotErrorCode.RATE_LIMITED);
    expect(err.detail).toBe("Rate limited");
    expect(err.name).toBe("RiotApiError");
    expect(err.message).toContain("RATE_LIMITED");
  });

  it("is instanceof Error", () => {
    const err = new RiotApiError(404, "/x", RiotErrorCode.NOT_FOUND, "nope");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(RiotApiError);
  });
});

describe("RiotErrorCode enum", () => {
  it("has all expected codes", () => {
    const expected = [
      "NOT_FOUND",
      "NOT_IN_GAME",
      "KEY_INVALID",
      "UNAUTHORIZED",
      "RATE_LIMITED",
      "SPECTATOR_UNAVAILABLE",
      "NETWORK_ERROR",
      "UNKNOWN",
    ];
    for (const code of expected) {
      expect(Object.values(RiotErrorCode)).toContain(code);
    }
  });
});

describe("HTTP wrapper retry logic (simulated)", () => {
  let callCount: number;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callCount = 0;
    mockFetch = vi.fn();
  });

  async function simulateFetchWithRetry(
    fetchFn: () => Promise<Response>,
    maxRetries = 3,
  ): Promise<unknown> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      callCount++;
      const res = await fetchFn();

      if (res.ok) return res.json();

      if (res.status === 429 && attempt < maxRetries) {
        // simulate short backoff
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }

      if (res.status === 429) {
        throw new RiotApiError(429, "/test", RiotErrorCode.RATE_LIMITED, "Max retries");
      }

      if (res.status === 404) {
        throw new RiotApiError(404, "/test", RiotErrorCode.NOT_FOUND, "Not found");
      }

      throw new RiotApiError(res.status, "/test", RiotErrorCode.UNKNOWN, "Fail");
    }
    throw new RiotApiError(429, "/test", RiotErrorCode.RATE_LIMITED, "Max retries");
  }

  it("succeeds on first try", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: "ok" }),
    });

    const result = await simulateFetchWithRetry(() => mockFetch());
    expect(result).toEqual({ data: "ok" });
    expect(callCount).toBe(1);
  });

  it("retries on 429 then succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: "recovered" }),
      });

    const result = await simulateFetchWithRetry(() => mockFetch());
    expect(result).toEqual({ data: "recovered" });
    expect(callCount).toBe(2);
  });

  it("throws NOT_FOUND on 404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(simulateFetchWithRetry(() => mockFetch())).rejects.toThrow(
      RiotApiError,
    );
  });

  it("throws RATE_LIMITED after max retries", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "1" }),
    });

    await expect(
      simulateFetchWithRetry(() => mockFetch(), 2),
    ).rejects.toMatchObject({ code: RiotErrorCode.RATE_LIMITED });
    expect(callCount).toBe(3); // initial + 2 retries
  });
});
