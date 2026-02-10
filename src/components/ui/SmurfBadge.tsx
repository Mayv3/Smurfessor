import type { SmurfSeverity } from "../../lib/smurf/rules";
import { IconShield, IconWarning } from "./Icons";

interface Props {
  severity: SmurfSeverity;
  label: string;
  probability: number;
  reasons: string[];
}

export function SmurfBadge({ severity, label, probability, reasons }: Props) {
  if (severity === "none") return null;

  const isConfirmed = severity === "confirmed";

  const badgeClass = isConfirmed
    ? "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400/50 shadow-lg shadow-red-500/20"
    : "bg-gradient-to-r from-yellow-600 to-amber-500 text-white border-yellow-400/50 shadow-lg shadow-yellow-500/20";

  const tooltipBorder = isConfirmed ? "border-red-500/30" : "border-yellow-500/30";
  const tooltipGlow = isConfirmed ? "shadow-red-500/10" : "shadow-yellow-500/10";

  const icon = isConfirmed ? (
    <IconShield className="w-3 h-3" />
  ) : (
    <IconWarning className="w-3 h-3" />
  );

  return (
    <div className="relative group inline-flex">
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border ${badgeClass} cursor-help leading-tight transition-transform hover:scale-105`}
      >
        {icon}
        {isConfirmed ? label : `${label} (${probability}%)`}
      </span>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block min-w-[260px] animate-fadeIn">
        <div className={`bg-gray-900/95 backdrop-blur-sm border ${tooltipBorder} rounded-xl shadow-2xl ${tooltipGlow} p-4 text-sm text-gray-300 space-y-2`}>
          <div className={`font-bold mb-2 flex items-center gap-2 ${isConfirmed ? 'text-red-400' : 'text-yellow-400'}`}>
            {icon}
            {isConfirmed ? "Smurf detectado" : "Posible smurf"}
          </div>
          <div className="space-y-1.5">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="text-gray-300/90 text-xs leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
