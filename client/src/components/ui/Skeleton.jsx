/**
 * Placeholder shaped like the content it replaces, so nothing shifts when the
 * real data lands (ARCHITECTURE.md §4.5).
 */
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-canvas ${className}`} />;
}

export function SkeletonRows({ count = 4, className = 'h-14' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
