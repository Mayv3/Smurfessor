export function SkeletonLoader() {
  return (
    <div className="space-y-8 py-4 animate-fadeIn">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="h-8 w-28 rounded-full bg-gray-800 animate-shimmer" />
        </div>
        <div className="h-7 bg-gray-800 rounded-lg w-1/3 mx-auto animate-shimmer" style={{ animationDelay: '100ms' }} />
        <div className="h-4 bg-gray-800/60 rounded w-1/6 mx-auto animate-shimmer" style={{ animationDelay: '200ms' }} />
      </div>

      {/* Two teams of 5 columns each */}
      {[0, 1].map((team) => (
        <div key={team} className="space-y-3">
          {/* Team header skeleton */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-800/20">
            <div className="w-3 h-3 rounded-full bg-gray-700 animate-shimmer" />
            <div className="h-4 w-16 rounded bg-gray-700 animate-shimmer" />
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Role label row */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`role-skel-${team}-${i}`} className="flex items-center justify-center py-1">
                <div className="w-12 h-4 rounded bg-gray-800/40 animate-shimmer" style={{ animationDelay: `${i * 60}ms` }} />
              </div>
            ))}
          </div>

          {/* 5 card skeletons */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={`card-skel-${team}-${i}`}
                className="rounded-xl border border-gray-700/30 bg-gray-800/30 overflow-hidden"
                style={{ animationDelay: `${(team * 5 + i) * 70}ms` }}
              >
                <div className="h-1 bg-gray-700/50 animate-shimmer" />
                <div className="p-3 space-y-3">
                  {/* Champion + name */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-700/60 shrink-0 animate-shimmer" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-gray-700/50 rounded w-3/4 animate-shimmer" />
                      <div className="h-2.5 bg-gray-700/30 rounded w-1/2 animate-shimmer" />
                    </div>
                  </div>
                  {/* Rank */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-700/40 animate-shimmer" />
                    <div className="h-3 bg-gray-700/40 rounded w-16 animate-shimmer" />
                  </div>
                  {/* Stats */}
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-gray-700/30 rounded w-full animate-shimmer" />
                    <div className="h-2.5 bg-gray-700/30 rounded w-2/3 animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* VS divider skeleton */}
      <div className="flex items-center gap-4 py-2" style={{ order: -1 }}>
        <div className="flex-1 h-px bg-gray-800" />
        <div className="w-14 h-7 rounded-full bg-gray-800 animate-shimmer" />
        <div className="flex-1 h-px bg-gray-800" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-2.5 p-3 rounded-xl border border-gray-700/20 bg-gray-800/20">
      <div className="h-4 bg-gray-700/50 rounded w-3/4 animate-shimmer" />
      <div className="h-3 bg-gray-700/30 rounded w-1/2 animate-shimmer" />
      <div className="h-3 bg-gray-700/30 rounded w-2/3 animate-shimmer" />
    </div>
  );
}
