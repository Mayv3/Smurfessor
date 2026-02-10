/**
 * RankBadge — shows ranked tier with official Riot emblem images
 * Images from Community Dragon (Riot's CDN for static assets)
 */

interface Props {
  label: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  compact?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400",
  BRONZE: "text-amber-600",
  SILVER: "text-gray-300",
  GOLD: "text-yellow-400",
  PLATINUM: "text-teal-300",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-300",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-amber-300",
};

/** Community Dragon ranked emblem images */
function rankEmblemUrl(tier: string): string {
  const t = tier.toLowerCase();
  const ext = t === 'emerald' ? 'svg' : 'png';
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${t}.${ext}`;
}

export function RankBadge({ label, tier, rank, lp, wins, losses, compact }: Props) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = TIER_COLORS[tier] ?? "text-gray-400";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <img
          src={rankEmblemUrl(tier)}
          alt={tier}
          className="w-6 h-6 object-contain"
          loading="lazy"
        />
        <span className={`text-xs font-bold ${color}`}>
          {tier} {rank}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 rounded-lg p-2.5 flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <img
          src={rankEmblemUrl(tier)}
          alt={tier}
          className="w-8 h-8 object-contain"
          loading="lazy"
        />
        <div>
          <span className={`font-bold text-sm ${color}`}>
            {tier} {rank}
          </span>
          <div className="text-xs text-gray-400">{lp} LP</div>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 mt-1">
        {winRate}% WR ({wins}W-{losses}L)
      </div>
    </div>
  );
}
