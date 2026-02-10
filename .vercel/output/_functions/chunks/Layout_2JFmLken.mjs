import { e as createComponent, g as addAttribute, l as renderHead, k as renderComponent, n as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_CxIlnfDj.mjs';
import 'piccolore';
/* empty css                         */
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';

const CONFIG = {
  loading: { icon: "⏳", bg: "bg-gray-700/60 border-gray-600", text: "text-gray-300" },
  active: { icon: "✅", bg: "bg-emerald-900/50 border-emerald-600/40", text: "text-emerald-300" },
  expired: { icon: "❌", bg: "bg-red-900/50 border-red-500/40", text: "text-red-300" },
  missing: { icon: "⚠️", bg: "bg-yellow-900/50 border-yellow-600/40", text: "text-yellow-300" },
  "rate-limited": { icon: "🟡", bg: "bg-yellow-900/50 border-yellow-600/40", text: "text-yellow-300" },
  error: { icon: "🔌", bg: "bg-orange-900/50 border-orange-500/40", text: "text-orange-300" }
};
function ApiKeyBanner() {
  const [data, setData] = useState({ status: "loading", message: "Verificando API key…" });
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    fetch("/api/key-status").then((r) => r.json()).then((json) => {
      if (json.ok) setData(json.data);
      else setData({ status: "error", message: "Error al verificar" });
    }).catch(() => setData({ status: "error", message: "Error de red" }));
  }, []);
  if (dismissed) return null;
  if (data.status === "active") {
    return /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs bg-emerald-900/30 border-emerald-700/30", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-emerald-400", children: [
        "✅ ",
        data.message
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setDismissed(true),
          className: "text-emerald-600 hover:text-emerald-400 transition-colors text-base leading-none",
          "aria-label": "Cerrar",
          children: "×"
        }
      )
    ] });
  }
  const cfg = CONFIG[data.status];
  return /* @__PURE__ */ jsxs("div", { className: `mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${cfg.bg}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
      /* @__PURE__ */ jsx("span", { className: "text-base shrink-0", children: cfg.icon }),
      /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${cfg.text}`, children: data.message }),
      (data.status === "missing" || data.status === "expired") && /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://developer.riotgames.com",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 shrink-0",
          children: "Obtener key →"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setDismissed(true),
        className: "text-gray-500 hover:text-white transition-colors text-base leading-none shrink-0",
        "aria-label": "Cerrar",
        children: "×"
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="es" class="dark"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><meta name="description" content="Smurfessor — Dashboard de cuentas de League of Legends"><title>${title} | Smurfessor</title>${renderHead()}</head> <body class="bg-gray-900 min-h-screen flex flex-col"> <header class="bg-gray-800/80 backdrop-blur border-b border-gray-700 sticky top-0 z-50"> <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3"> <a href="/" class="text-xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
🎮 Smurfessor
</a> <span class="text-xs text-gray-500 hidden sm:inline">Porofessor-lite</span> <div class="ml-auto"> <a href="/search" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"> <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="11" cy="11" r="8"></circle> <path d="M21 21l-4.35-4.35"></path> </svg>
Buscar
</a> </div> </div> </header> <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6"> ${renderComponent($$result, "ApiKeyBanner", ApiKeyBanner, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/components/ApiKeyBanner", "client:component-export": "ApiKeyBanner" })} ${renderSlot($$result, $$slots["default"])} </main> <footer class="text-center text-gray-600 text-xs py-4 border-t border-gray-800">
Smurfessor — Proyecto no oficial. No afiliado a Riot Games.
</footer> </body></html>`;
}, "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
