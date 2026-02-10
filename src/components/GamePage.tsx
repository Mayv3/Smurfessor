import { useState } from "react";
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

/* ── React-Query client (one per island) ─────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── Inner component (uses hooks) ────────────────────── */
function GamePageInner({ accountKey }: { accountKey: string }) {
  const [retryCount, setRetryCount] = useState(0);

  /* 1) Resolve account → puuid */
  const resolveQ = useQuery({
    queryKey: ["resolve", accountKey],
    queryFn: async () => {
      const res = await fetch(
        `/api/resolve?key=${encodeURIComponent(accountKey)}`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Resolve failed");
      return json.data as {
        account: { riotId: { gameName: string; tagLine: string }; platform: string };
        puuid: string;
      };
    },
  });

  /* 2) Fetch live game */
  const liveQ = useQuery({
    queryKey: ["live-game", resolveQ.data?.puuid, retryCount],
    queryFn: async () => {
      const puuid = resolveQ.data!.puuid;
      const res = await fetch(
        `/api/live-game?puuid=${encodeURIComponent(puuid)}&platform=LA2`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Live-game failed");
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
    staleTime: 60 * 60 * 1000, // 1 h client-side
  });

  /* ── Loading ────────────────────────────────────────── */
  if (resolveQ.isLoading || liveQ.isLoading || ddQ.isLoading) {
    return <SkeletonLoader />;
  }

  /* ── Errors ─────────────────────────────────────────── */
  if (resolveQ.isError) {
    return <ErrorBanner message={resolveQ.error.message} />;
  }
  if (ddQ.isError) {
    return <ErrorBanner message={`DDragon: ${ddQ.error.message}`} />;
  }
  if (liveQ.isError) {
    return <ErrorBanner message={liveQ.error.message} />;
  }

  /* ── Live game found ────────────────────────────────── */
  const liveGame = liveQ.data;
  const ddragon = ddQ.data;

  if (liveGame?.available && ddragon) {
    return (
      <div>
        <MatchView game={liveGame} ddragon={ddragon} />
        <div className="text-center mt-6">
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <IconRefresh className="w-4 h-4" />
            Refrescar partida
          </button>
        </div>
      </div>
    );
  }

  /* ── Offline / not in game ──────────────────────────── */
  return (
    <div>
      <OfflineView
        account={resolveQ.data?.account}
        reason={liveGame?.reason ?? "NOT_IN_GAME"}
      />
      <div className="text-center mt-4">
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <IconRefresh className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  );
}

/* ── Exported island wrapper ─────────────────────────── */
export function GamePage({ accountKey }: { accountKey: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GamePageInner accountKey={accountKey} />
    </QueryClientProvider>
  );
}
