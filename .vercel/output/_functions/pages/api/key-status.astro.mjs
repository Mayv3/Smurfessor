import { o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  let apiKey = "";
  try {
    apiKey = "RGAPI-1eaac8de-09e1-4a96-946e-4558be7ba4f9";
  } catch {
    apiKey = "";
  }
  if (!apiKey || apiKey.startsWith("RGAPI-xxxx")) {
    return ok({ status: "missing", message: "API key no configurada" });
  }
  try {
    const res = await fetch(
      "https://la2.api.riotgames.com/lol/status/v4/platform-data",
      {
        headers: { "X-Riot-Token": apiKey },
        signal: AbortSignal.timeout(8e3)
      }
    );
    if (res.ok) {
      return ok({ status: "active", message: "API key activa ✓" });
    }
    if (res.status === 401 || res.status === 403) {
      return ok({
        status: "expired",
        message: "API key expirada o inválida"
      });
    }
    if (res.status === 429) {
      return ok({
        status: "rate-limited",
        message: "API key activa (rate limited)"
      });
    }
    return ok({
      status: "error",
      message: `API respondió ${res.status}`
    });
  } catch {
    return ok({
      status: "error",
      message: "No se pudo verificar la API key (timeout/red)"
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
