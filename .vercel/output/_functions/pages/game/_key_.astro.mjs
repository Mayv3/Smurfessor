import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_CxIlnfDj.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_CRjDM8G8.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { S as SkeletonLoader, E as ErrorBanner, M as MatchView, I as IconRefresh, O as OfflineView } from '../../chunks/ErrorBanner_DgSS1eGX.mjs';
import { A as ACCOUNTS } from '../../chunks/accounts_BS9-O4eu.mjs';
export { renderers } from '../../renderers.mjs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3e4,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});
function GamePageInner({ accountKey }) {
  const [retryCount, setRetryCount] = useState(0);
  const liveQ = useQuery({
    queryKey: ["live-game", accountKey, retryCount],
    queryFn: async () => {
      const res = await fetch(
        `/api/live-game?key=${encodeURIComponent(accountKey)}`
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Live-game failed");
      return json.data;
    }
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
    // 1 h client-side
  });
  if (liveQ.isLoading || ddQ.isLoading) {
    return /* @__PURE__ */ jsx(SkeletonLoader, {});
  }
  if (ddQ.isError) {
    return /* @__PURE__ */ jsx(ErrorBanner, { message: `DDragon: ${ddQ.error.message}` });
  }
  if (liveQ.isError) {
    return /* @__PURE__ */ jsx(ErrorBanner, { message: liveQ.error.message });
  }
  const liveGame = liveQ.data;
  const ddragon = ddQ.data;
  if (liveGame?.available && ddragon) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(MatchView, { game: liveGame, ddragon }),
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
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      OfflineView,
      {
        account: void 0,
        reason: liveGame?.reason ?? "NOT_IN_GAME"
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
  ] });
}
function GamePage({ accountKey }) {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(GamePageInner, { accountKey }) });
}

const $$Astro = createAstro();
const $$key = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$key;
  const { key } = Astro2.params;
  const account = ACCOUNTS.find((a) => a.key === key);
  if (!account) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": account.riotId.gameName }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-4"> <a href="/" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
← Volver al dashboard
</a> </div> ${renderComponent($$result2, "GamePage", GamePage, { "accountKey": account.key, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/pacho/Desktop/projectito/Smurfessor/src/components/GamePage", "client:component-export": "GamePage" })} ` })}`;
}, "C:/Users/pacho/Desktop/projectito/Smurfessor/src/pages/game/[key].astro", void 0);

const $$file = "C:/Users/pacho/Desktop/projectito/Smurfessor/src/pages/game/[key].astro";
const $$url = "/game/[key]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$key,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
