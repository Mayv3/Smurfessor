import { useState, useEffect } from "react";

type KeyStatus = "loading" | "active" | "expired" | "missing" | "rate-limited" | "error";

interface StatusData {
  status: KeyStatus;
  message: string;
}

const CONFIG: Record<KeyStatus, { icon: string; bg: string; text: string }> = {
  loading:      { icon: "⏳", bg: "bg-gray-700/60 border-gray-600",   text: "text-gray-300" },
  active:       { icon: "✅", bg: "bg-emerald-900/50 border-emerald-600/40", text: "text-emerald-300" },
  expired:      { icon: "❌", bg: "bg-red-900/50 border-red-500/40",  text: "text-red-300" },
  missing:      { icon: "⚠️", bg: "bg-yellow-900/50 border-yellow-600/40", text: "text-yellow-300" },
  "rate-limited": { icon: "🟡", bg: "bg-yellow-900/50 border-yellow-600/40", text: "text-yellow-300" },
  error:        { icon: "🔌", bg: "bg-orange-900/50 border-orange-500/40", text: "text-orange-300" },
};

export function ApiKeyBanner() {
  const [data, setData] = useState<StatusData>({ status: "loading", message: "Verificando API key…" });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/key-status")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
        else setData({ status: "error", message: "Error al verificar" });
      })
      .catch(() => setData({ status: "error", message: "Error de red" }));
  }, []);

  if (dismissed) return null;

  /* Don't show banner if key is active — less noise */
  if (data.status === "active") {
    return (
      <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs bg-emerald-900/30 border-emerald-700/30">
        <span className="text-emerald-400">
          ✅ {data.message}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-600 hover:text-emerald-400 transition-colors text-base leading-none"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    );
  }

  const cfg = CONFIG[data.status];

  return (
    <div className={`mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${cfg.bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{cfg.icon}</span>
        <span className={`text-sm font-medium ${cfg.text}`}>{data.message}</span>
        {(data.status === "missing" || data.status === "expired") && (
          <a
            href="https://developer.riotgames.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 shrink-0"
          >
            Obtener key →
          </a>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-500 hover:text-white transition-colors text-base leading-none shrink-0"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}
