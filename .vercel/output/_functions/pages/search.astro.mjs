import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CxIlnfDj.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_2JFmLken.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { S as SkeletonLoader, E as ErrorBanner, M as MatchView, I as IconRefresh, O as OfflineView } from '../chunks/ErrorBanner_Ci3cR-NQ.mjs';
export { renderers } from '../renderers.mjs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3e4,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
function IconSearch({ className = "w-5 h-5" }) {
  return /* @__PURE__ */ jsxs("svg", { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ jsx("path", { d: "M21 21l-4.35-4.35" })
  ] });
}
const REGIONS = [
  { value: "LA2", label: "LAS", flag: "🌎" },
  { value: "LA1", label: "LAN", flag: "🌎" },
  { value: "NA1", label: "NA", flag: "🇺🇸" },
  { value: "BR1", label: "Brasil", flag: "🇧🇷" },
  { value: "EUW1", label: "EU West", flag: "🇪🇺" },
  { value: "EUN1", label: "EU Nordic & East", flag: "🇪🇺" },
  { value: "KR", label: "Korea", flag: "🇰🇷" },
  { value: "JP1", label: "Japón", flag: "🇯🇵" },
  { value: "OC1", label: "Oceanía", flag: "🇦🇺" },
  { value: "TR1", label: "Turquía", flag: "🇹🇷" },
  { value: "RU", label: "Rusia", flag: "🇷🇺" },
  { value: "PH2", label: "Filipinas", flag: "🇵🇭" },
  { value: "SG2", label: "Singapur", flag: "🇸🇬" },
  { value: "TH2", label: "Tailandia", flag: "🇹🇭" },
  { value: "TW2", label: "Taiwán", flag: "🇹🇼" },
  { value: "VN2", label: "Vietnam", flag: "🇻🇳" },
  { value: "ME1", label: "Medio Oriente", flag: "🌍" }
];
function SearchPageInner() {
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("LA2");
  const [searchTarget, setSearchTarget] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchError, setSearchError] = useState(null);
  const handleSearch = useCallback(() => {
    setSearchError(null);
    const trimmed = input.trim();
    if (!trimmed) return;
    let gameName;
    let tagLine;
    if (trimmed.includes("#")) {
      const parts = trimmed.split("#");
      gameName = parts[0].trim();
      tagLine = parts.slice(1).join("#").trim();
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) {
        setSearchError("Formato: Nombre#Tag (ej: HideOnBush#KR1)");
        return;
      }
      tagLine = parts.pop();
      gameName = parts.join(" ");
    }
    if (!gameName || !tagLine) {
      setSearchError("Formato: Nombre#Tag (ej: HideOnBush#KR1)");
      return;
    }
    setSearchTarget({ gameName, tagLine, platform });
    setRetryCount(0);
  }, [input, platform]);
  const resolveQ = useQuery({
    queryKey: ["search-resolve", searchTarget?.gameName, searchTarget?.tagLine, searchTarget?.platform],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?gameName=${encodeURIComponent(searchTarget.gameName)}&tagLine=${encodeURIComponent(searchTarget.tagLine)}&platform=${encodeURIComponent(searchTarget.platform)}`
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "No se encontró la cuenta");
      return json.data;
    },
    enabled: !!searchTarget
  });
  const liveQ = useQuery({
    queryKey: ["search-live-game", resolveQ.data?.puuid, searchTarget?.platform, retryCount],
    queryFn: async () => {
      const puuid = resolveQ.data.puuid;
      const p = searchTarget.platform;
      const res = await fetch(
        `/api/live-game?puuid=${encodeURIComponent(puuid)}&platform=${encodeURIComponent(p)}`
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Error buscando partida");
      return json.data;
    },
    enabled: !!resolveQ.data?.puuid
  });
  const ddQ = useQuery({
    queryKey: ["ddragon-bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/ddragon/bootstrap");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "DDragon failed");
      return json.data;
    },
    staleTime: 60 * 60 * 1e3
  });
  const isLoading = searchTarget && (resolveQ.isLoading || liveQ.isLoading || ddQ.isLoading);
  const liveGame = liveQ.data;
  const ddragon = ddQ.data;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Buscar invocador" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm", children: "Ingresá el nombre y tag del invocador para ver su partida en vivo" })
      ] }),
      /* @__PURE__ */ jsxs(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            handleSearch();
          },
          className: "flex gap-2",
          children: [
            /* @__PURE__ */ jsx(
              "select",
              {
                value: platform,
                onChange: (e) => setPlatform(e.target.value),
                className: "px-3 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shrink-0 cursor-pointer",
                children: REGIONS.map((r) => /* @__PURE__ */ jsxs("option", { value: r.value, children: [
                  r.flag,
                  " ",
                  r.label
                ] }, r.value))
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsx(IconSearch, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: input,
                  onChange: (e) => setInput(e.target.value),
                  placeholder: "Nombre#Tag (ej: HideOnBush#KR1)",
                  className: "w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors",
                  autoFocus: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: !input.trim(),
                className: "px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors shrink-0",
                children: "Buscar"
              }
            )
          ]
        }
      ),
      searchError && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm mt-2 text-center", children: searchError })
    ] }),
    isLoading && /* @__PURE__ */ jsx(SkeletonLoader, {}),
    resolveQ.isError && searchTarget && /* @__PURE__ */ jsx(ErrorBanner, { message: resolveQ.error.message }),
    liveQ.isError && !liveQ.isLoading && /* @__PURE__ */ jsx(ErrorBanner, { message: liveQ.error.message }),
    !isLoading && liveGame?.available && ddragon && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(MatchView, { game: liveGame, ddragon, platform: searchTarget?.platform ?? "LA2" }),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setRetryCount((c) => c + 1),
          className: "inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors",
          children: [
            /* @__PURE__ */ jsx(IconRefresh, { className: "w-4 h-4" }),
            "Refrescar partida"
          ]
        }
      ) })
    ] }),
    !isLoading && resolveQ.data && liveGame && !liveGame.available && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        OfflineView,
        {
          account: resolveQ.data.account,
          reason: liveGame.reason ?? "NOT_IN_GAME"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-4", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setRetryCount((c) => c + 1),
          className: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors",
          children: [
            /* @__PURE__ */ jsx(IconRefresh, { className: "w-4 h-4" }),
            "Reintentar"
          ]
        }
      ) })
    ] })
  ] });
}
function SearchPage() {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(SearchPageInner, {}) });
}

const $$Search = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Buscar invocador" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-4"> <a href="/" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
← Volver al dashboard
</a> </div> ${renderComponent($$result2, "SearchPage", SearchPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/components/SearchPage", "client:component-export": "SearchPage" })} ` })}`;
}, "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/search.astro", void 0);

const $$file = "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
