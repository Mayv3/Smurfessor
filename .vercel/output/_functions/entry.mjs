import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CdZhFOiC.mjs';
import { manifest } from './manifest_B-uGAFzD.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/accounts.astro.mjs');
const _page2 = () => import('./pages/api/cron/refresh.astro.mjs');
const _page3 = () => import('./pages/api/ddragon/bootstrap.astro.mjs');
const _page4 = () => import('./pages/api/key-status.astro.mjs');
const _page5 = () => import('./pages/api/live-game.astro.mjs');
const _page6 = () => import('./pages/api/player-cards.astro.mjs');
const _page7 = () => import('./pages/api/player-summaries.astro.mjs');
const _page8 = () => import('./pages/api/player-summary.astro.mjs');
const _page9 = () => import('./pages/api/resolve.astro.mjs');
const _page10 = () => import('./pages/api/search.astro.mjs');
const _page11 = () => import('./pages/game/_key_.astro.mjs');
const _page12 = () => import('./pages/search.astro.mjs');
const _page13 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/accounts.ts", _page1],
    ["src/pages/api/cron/refresh.ts", _page2],
    ["src/pages/api/ddragon/bootstrap.ts", _page3],
    ["src/pages/api/key-status.ts", _page4],
    ["src/pages/api/live-game.ts", _page5],
    ["src/pages/api/player-cards.ts", _page6],
    ["src/pages/api/player-summaries.ts", _page7],
    ["src/pages/api/player-summary.ts", _page8],
    ["src/pages/api/resolve.ts", _page9],
    ["src/pages/api/search.ts", _page10],
    ["src/pages/game/[key].astro", _page11],
    ["src/pages/search.astro", _page12],
    ["src/pages/index.astro", _page13]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "82e6b976-72a3-4370-8fd7-16648fa347b3",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
