import { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SpeedIcon from "@mui/icons-material/Speed";
import WifiOffIcon from "@mui/icons-material/WifiOff";

type KeyStatus = "loading" | "active" | "expired" | "missing" | "rate-limited" | "error";

interface StatusData {
  status: KeyStatus;
  message: string;
}

const CONFIG: Record<KeyStatus, { 
  Icon: typeof CheckCircleIcon; 
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
          <StatusIcon className={`${cfg.text} !w-5 !h-5`} />
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
