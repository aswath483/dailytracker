export function SkeletonCard() {
  return (
    <div className="flex gap-3 py-1">
      <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 skeleton rounded-full w-28" />
        <div className="h-20 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 flex flex-col items-center">
      <div className="w-10 h-10 skeleton rounded-full" />
      <div className="h-3 skeleton rounded-full w-16" />
    </div>
  );
}
