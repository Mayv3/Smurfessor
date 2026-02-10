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
    ? "bg-red-600 text-white border-red-400"
    : "bg-yellow-600/90 text-white border-yellow-400";

  const icon = isConfirmed ? (
    <IconShield className="w-2.5 h-2.5" />
  ) : (
    <IconWarning className="w-2.5 h-2.5" />
  );

  return (
    <div className="relative group inline-flex">
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass} cursor-help leading-tight`}
      >
        {icon}
        {isConfirmed ? label : `${label} (${probability}%)`}
      </span>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover:block min-w-[240px]">
        <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 text-sm text-gray-300 space-y-1.5">
          <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
            {icon}
            {isConfirmed ? "Smurf detectado" : "Posible smurf"}
          </div>
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gray-500 shrink-0 mt-0.5">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
