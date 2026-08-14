export default function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-4 bg-accent-soft rounded w-1/3 mb-2" />
          <div className="h-3 bg-accent-soft rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}
