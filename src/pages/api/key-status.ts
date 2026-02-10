import type { APIRoute } from "astro";
import { ok } from "../../lib/api-response";

export const GET: APIRoute = async () => {
  let apiKey = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiKey = (import.meta as any).env?.RIOT_API_KEY ?? process.env.RIOT_API_KEY ?? "";
  } catch {
    apiKey = "";
  }

  /* No key configured at all */
  if (!apiKey || apiKey.startsWith("RGAPI-xxxx")) {
    return ok({ status: "missing", message: "API key no configurada" });
  }

  /* Try a lightweight call: Riot account status endpoint (platform status) */
  try {
    const res = await fetch(
      "https://la2.api.riotgames.com/lol/status/v4/platform-data",
      {
        headers: { "X-Riot-Token": apiKey },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.ok) {
      return ok({ status: "active", message: "API key activa ✓" });
    }

    if (res.status === 401 || res.status === 403) {
      return ok({
        status: "expired",
        message: "API key expirada o inválida",
      });
    }

    if (res.status === 429) {
      return ok({
        status: "rate-limited",
        message: "API key activa (rate limited)",
      });
    }

    return ok({
      status: "error",
      message: `API respondió ${res.status}`,
    });
  } catch {
    return ok({
      status: "error",
      message: "No se pudo verificar la API key (timeout/red)",
    });
  }
};
