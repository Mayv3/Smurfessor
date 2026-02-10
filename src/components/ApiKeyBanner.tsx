import { useState, useEffect } from "react";

/* ── Inline SVG icons (replaces @mui/icons-material) ── */
function CheckCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}
function ErrorIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}
function WarningIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );
}
function HourglassEmptyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z" />
    </svg>
  );
}
function SpeedIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 001.72 1h13.85a2 2 0 001.74-1 10 10 0 00-.27-10.44zM10.59 15.41a2 2 0 002.83 0l5.66-8.49-8.49 5.66a2 2 0 000 2.83z" />
    </svg>
  );
}
function WifiOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24.24 8l1.76-1.77A15.93 15.93 0 0012 2C7.31 2 3.07 3.9 0 6.23L12 21l3.5-4.33L2.1 3.51l1.41-1.41L21.9 20.49l-1.41 1.41-3.23-3.23L12 21 0 6.23A15.93 15.93 0 0112 2c3.38 0 6.49 1.06 9.05 2.87l-1.29 1.6A13.94 13.94 0 0012 4c-3.04 0-5.85.96-8.15 2.58L12 16.76l2.42-3 5.07-5.07L21.24 7z" />
    </svg>
  );
}

type IconComponent = typeof CheckCircleIcon;

type KeyStatus = "loading" | "active" | "expired" | "missing" | "rate-limited" | "error";

interface StatusData {
  status: KeyStatus;
  message: string;
}

const CONFIG: Record<KeyStatus, { 
  Icon: IconComponent; 
  bg: string; 
  border: string; 
  text: string; 
  dot: string 
}> = {
  loading:      { Icon: HourglassEmptyIcon, bg: "bg-gray-800/90",      border: "border-gray-700/60",     text: "text-gray-300",    dot: "bg-gray-500" },
  active:       { Icon: CheckCircleIcon,    bg: "bg-emerald-900/90",  border: "border-emerald-600/60", text: "text-emerald-300", dot: "bg-emerald-500" },
  expired:      { Icon: ErrorIcon,          bg: "bg-red-900/90",      border: "border-red-500/60",     text: "text-red-300",     dot: "bg-red-500" },
  missing:      { Icon: WarningIcon,        bg: "bg-yellow-900/90",   border: "border-yellow-600/60",  text: "text-yellow-300",  dot: "bg-yellow-500" },
  "rate-limited": { Icon: SpeedIcon,        bg: "bg-yellow-900/90",   border: "border-yellow-600/60",  text: "text-yellow-300",  dot: "bg-yellow-500" },
  error:        { Icon: WifiOffIcon,        bg: "bg-orange-900/90",   border: "border-orange-500/60",  text: "text-orange-300",  dot: "bg-orange-500" },
};

export function ApiKeyBanner() {
  const [data, setData] = useState<StatusData>({ status: "loading", message: "Verificando…" });

  useEffect(() => {
    fetch("/api/key-status")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
        else setData({ status: "error", message: "Error al verificar" });
      })
      .catch(() => setData({ status: "error", message: "Error de red" }));
  }, []);

  const cfg = CONFIG[data.status];
  const StatusIcon = cfg.Icon;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slideUp">
      <div
        className={`flex items-center gap-3 rounded-2xl border backdrop-blur-xl shadow-2xl px-4 py-3 transition-all ${cfg.bg} ${cfg.border}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${data.status === "active" ? "animate-pulse" : ""}`} />
          <StatusIcon className={`${cfg.text} w-5 h-5`} />
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold ${cfg.text} whitespace-nowrap`}>
            {data.status === "loading" ? "Verificando API key" : data.message}
          </span>
          {(data.status === "missing" || data.status === "expired") && (
            <a
              href="https://developer.riotgames.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium whitespace-nowrap"
            >
              Obtener key →
            </a>
          )}
        </div>

        <div className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/20 ${cfg.text}`}>
          {data.status}
        </div>
      </div>
    </div>
  );
}
