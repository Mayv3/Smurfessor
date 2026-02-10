import { useState, useCallback } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { MatchView } from "./MatchView";
import { OfflineView } from "./OfflineView";
import { SkeletonLoader } from "./ui/SkeletonLoader";
import { ErrorBanner } from "./ui/ErrorBanner";
import { IconRefresh } from "./ui/Icons";

/* ── React-Query client ──────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── Search icon ─────────────────────────────────────── */
function IconSearch({ className = "w-5 h-5" }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/* ── All LoL regions ─────────────────────────────────── */
const REGIONS = [
  { value: "LA2",  label: "LAS",            flag: "🌎" },
  { value: "LA1",  label: "LAN",            flag: "🌎" },
  { value: "NA1",  label: "NA",             flag: "🇺🇸" },
  { value: "BR1",  label: "Brasil",         flag: "🇧🇷" },
  { value: "EUW1", label: "EU West",        flag: "🇪🇺" },
  { value: "EUN1", label: "EU Nordic & East",flag: "🇪🇺" },
  { value: "KR",   label: "Korea",          flag: "🇰🇷" },
  { value: "JP1",  label: "Japón",          flag: "🇯🇵" },
  { value: "OC1",  label: "Oceanía",        flag: "🇦🇺" },
  { value: "TR1",  label: "Turquía",        flag: "🇹🇷" },
  { value: "RU",   label: "Rusia",          flag: "🇷🇺" },
  { value: "PH2",  label: "Filipinas",      flag: "🇵🇭" },
  { value: "SG2",  label: "Singapur",       flag: "🇸🇬" },
  { value: "TH2",  label: "Tailandia",      flag: "🇹🇭" },
  { value: "TW2",  label: "Taiwán",         flag: "🇹🇼" },
  { value: "VN2",  label: "Vietnam",        flag: "🇻🇳" },
  { value: "ME1",  label: "Medio Oriente",  flag: "🌍" },
] as const;

/* ── Inner component ─────────────────────────────────── */
function SearchPageInner() {
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("LA2");
  const [searchTarget, setSearchTarget] = useState<{ gameName: string; tagLine: string; platform: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    setSearchError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    /* Support both "Name#Tag" and "Name Tag" formats */
    let gameName: string;
    let tagLine: string;

    if (trimmed.includes("#")) {
      const parts = trimmed.split("#");
      gameName = parts[0].trim();
      tagLine = parts.slice(1).join("#").trim();
    } else {
      /* Try last word as tag */
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) {
        setSearchError("Formato: Nombre#Tag (ej: HideOnBush#KR1)");
        return;
      }
      tagLine = parts.pop()!;
      gameName = parts.join(" ");
    }

    if (!gameName || !tagLine) {
      setSearchError("Formato: Nombre#Tag (ej: HideOnBush#KR1)");
      return;
    }

    setSearchTarget({ gameName, tagLine, platform });
    setRetryCount(0);
  }, [input, platform]);

  /* 1) Resolve account → puuid */
  const resolveQ = useQuery({
    queryKey: ["search-resolve", searchTarget?.gameName, searchTarget?.tagLine, searchTarget?.platform],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?gameName=${encodeURIComponent(searchTarget!.gameName)}&tagLine=${encodeURIComponent(searchTarget!.tagLine)}&platform=${encodeURIComponent(searchTarget!.platform)}`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "No se encontró la cuenta");
      return json.data as {
        account: { riotId: { gameName: string; tagLine: string }; platform: string };
        puuid: string;
      };
    },
    enabled: !!searchTarget,
  });

  /* 2) Fetch live game */
  const liveQ = useQuery({
    queryKey: ["search-live-game", resolveQ.data?.puuid, searchTarget?.platform, retryCount],
    queryFn: async () => {
      const puuid = resolveQ.data!.puuid;
      const p = searchTarget!.platform;
      const res = await fetch(
        `/api/live-game?puuid=${encodeURIComponent(puuid)}&platform=${encodeURIComponent(p)}`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Error buscando partida");
      return json.data;
    },
    enabled: !!resolveQ.data?.puuid,
  });

  /* 3) DDragon bootstrap */
  const ddQ = useQuery({
    queryKey: ["ddragon-bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/ddragon/bootstrap");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "DDragon failed");
      return json.data;
    },
    staleTime: 60 * 60 * 1000,
  });

  /* ── Rendering ──────────────────────────────────────── */
  const isLoading = searchTarget && (resolveQ.isLoading || liveQ.isLoading || ddQ.isLoading);
  const liveGame = liveQ.data;
  const ddragon = ddQ.data;

  return (
    <div className="space-y-6">
      {/* ── Search bar ── */}
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Buscar invocador
          </h1>
          <p className="text-gray-500 text-sm">Ingresá el nombre y tag del invocador para ver su partida en vivo</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex gap-2 animate-slideUp"
        >
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shrink-0 cursor-pointer backdrop-blur-sm"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.flag} {r.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1 group">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nombre#Tag (ej: HideOnBush#KR1)"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:bg-gray-800/80 transition-all backdrop-blur-sm"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-all shrink-0 shadow-lg shadow-indigo-500/20 disabled:shadow-none hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:translate-y-0"
          >
            Buscar
          </button>
        </form>

        {searchError && (
          <p className="text-red-400 text-sm mt-3 text-center animate-fadeIn">{searchError}</p>
        )}
      </div>

      {/* ── Results ── */}
      {isLoading && <SkeletonLoader />}

      {resolveQ.isError && searchTarget && (
        <ErrorBanner message={resolveQ.error.message} />
      )}

      {liveQ.isError && !liveQ.isLoading && (
        <ErrorBanner message={liveQ.error.message} />
      )}

      {!isLoading && liveGame?.available && ddragon && (
        <div>
          <MatchView game={liveGame} ddragon={ddragon} platform={searchTarget?.platform ?? "LA2"} />
          <div className="text-center mt-6">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <IconRefresh className="w-4 h-4" />
              Refrescar partida
            </button>
          </div>
        </div>
      )}

      {!isLoading && resolveQ.data && liveGame && !liveGame.available && (
        <div>
          <OfflineView
            account={resolveQ.data.account}
            reason={liveGame.reason ?? "NOT_IN_GAME"}
          />
          <div className="text-center mt-4">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <IconRefresh className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Exported island wrapper ─────────────────────────── */
export function SearchPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchPageInner />
    </QueryClientProvider>
  );
}
