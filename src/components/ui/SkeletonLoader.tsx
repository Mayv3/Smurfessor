export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6 py-4">
      {/* Title */}
      <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto" />
      <div className="h-4 bg-gray-700/60 rounded w-1/5 mx-auto" />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3">
            <div className="h-6 bg-gray-700 rounded w-1/4 mx-auto" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg border border-gray-700" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-2 p-3">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-700/60 rounded w-1/2" />
      <div className="h-3 bg-gray-700/60 rounded w-2/3" />
    </div>
  );
}
