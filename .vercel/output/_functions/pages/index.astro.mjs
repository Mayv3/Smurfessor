import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_CxIlnfDj.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_2JFmLken.mjs';
import { A as ACCOUNTS } from '../chunks/accounts_BS9-O4eu.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="text-3xl font-bold text-center mb-2">Cuentas rastreadas</h1> <p class="text-gray-400 text-center mb-6 text-sm">
Clickeá una cuenta para ver si está en partida
</p>  <div class="max-w-lg mx-auto mb-8"> <a href="/search" class="flex items-center gap-3 w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-gray-300 transition-colors"> <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="11" cy="11" r="8"></circle> <path d="M21 21l-4.35-4.35"></path> </svg> <span>Buscar cualquier invocador...</span> </a> </div> <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"> ${ACCOUNTS.map((a) => renderTemplate`<a${addAttribute(`/game/${a.key}`, "href")} class="group block bg-gray-800 hover:bg-gray-750 rounded-xl p-5 transition-all border border-gray-700 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"> <div class="text-center"> <div class="text-lg font-bold text-white truncate group-hover:text-indigo-300 transition-colors"> ${a.label ?? a.riotId.gameName} </div> <div class="text-sm text-gray-400 mt-1">#${a.riotId.tagLine}</div> <div class="mt-3 inline-block px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"> ${a.platform} </div> </div> </a>`)} </div> ` })}`;
}, "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/index.astro", void 0);

const $$file = "C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
