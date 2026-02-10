import 'piccolore';
import { o as decodeKey } from './chunks/astro/server_CxIlnfDj.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CdV_rsks.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/","cacheDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/node_modules/.astro/","outDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/dist/","srcDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/","publicDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/public/","buildClientDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/dist/client/","buildServerDir":"file:///C:/Users/nicop/OneDrive/Desktop/Chotofessor/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/accounts","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/accounts\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"accounts","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/accounts.ts","pathname":"/api/accounts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/cron/refresh","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/cron\\/refresh\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"cron","dynamic":false,"spread":false}],[{"content":"refresh","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/cron/refresh.ts","pathname":"/api/cron/refresh","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/ddragon/bootstrap","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/ddragon\\/bootstrap\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"ddragon","dynamic":false,"spread":false}],[{"content":"bootstrap","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/ddragon/bootstrap.ts","pathname":"/api/ddragon/bootstrap","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/key-status","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/key-status\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"key-status","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/key-status.ts","pathname":"/api/key-status","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/live-game","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/live-game\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"live-game","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/live-game.ts","pathname":"/api/live-game","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/player-summaries","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/player-summaries\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"player-summaries","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/player-summaries.ts","pathname":"/api/player-summaries","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/player-summary","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/player-summary\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"player-summary","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/player-summary.ts","pathname":"/api/player-summary","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/resolve","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/resolve\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"resolve","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/resolve.ts","pathname":"/api/resolve","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/search","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/search\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/search.ts","pathname":"/api/search","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_key_.CIjBGiNQ.css"}],"routeData":{"route":"/game/[key]","isIndex":false,"type":"page","pattern":"^\\/game\\/([^/]+?)\\/?$","segments":[[{"content":"game","dynamic":false,"spread":false}],[{"content":"key","dynamic":true,"spread":false}]],"params":["key"],"component":"src/pages/game/[key].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_key_.CIjBGiNQ.css"}],"routeData":{"route":"/search","isIndex":false,"type":"page","pattern":"^\\/search\\/?$","segments":[[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/search.astro","pathname":"/search","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_key_.CIjBGiNQ.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/game/[key].astro",{"propagation":"none","containsHead":true}],["C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/pages/search.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/accounts@_@ts":"pages/api/accounts.astro.mjs","\u0000@astro-page:src/pages/api/cron/refresh@_@ts":"pages/api/cron/refresh.astro.mjs","\u0000@astro-page:src/pages/api/ddragon/bootstrap@_@ts":"pages/api/ddragon/bootstrap.astro.mjs","\u0000@astro-page:src/pages/api/key-status@_@ts":"pages/api/key-status.astro.mjs","\u0000@astro-page:src/pages/api/live-game@_@ts":"pages/api/live-game.astro.mjs","\u0000@astro-page:src/pages/api/player-summaries@_@ts":"pages/api/player-summaries.astro.mjs","\u0000@astro-page:src/pages/api/player-summary@_@ts":"pages/api/player-summary.astro.mjs","\u0000@astro-page:src/pages/api/resolve@_@ts":"pages/api/resolve.astro.mjs","\u0000@astro-page:src/pages/api/search@_@ts":"pages/api/search.astro.mjs","\u0000@astro-page:src/pages/game/[key]@_@astro":"pages/game/_key_.astro.mjs","\u0000@astro-page:src/pages/search@_@astro":"pages/search.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_D4OZv_6g.mjs","C:/Users/nicop/OneDrive/Desktop/Chotofessor/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_BlPoymXx.mjs","C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/components/GamePage":"_astro/GamePage.Ct5zS38m.js","C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/components/SearchPage":"_astro/SearchPage.Al6s5u3N.js","C:/Users/nicop/OneDrive/Desktop/Chotofessor/src/components/ApiKeyBanner":"_astro/ApiKeyBanner.BT5TlV1G.js","@astrojs/react/client.js":"_astro/client.Dc9Vh3na.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/_key_.CIjBGiNQ.css","/favicon.svg","/_astro/ApiKeyBanner.BT5TlV1G.js","/_astro/client.Dc9Vh3na.js","/_astro/ErrorBanner.CtW8yjaT.js","/_astro/GamePage.Ct5zS38m.js","/_astro/index.DiEladB3.js","/_astro/jsx-runtime.D_zvdyIk.js","/_astro/SearchPage.Al6s5u3N.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"+dcgY7qtIFI78hvqDI4/WC4NMaLTCkn6LoZJM1fUf10="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
