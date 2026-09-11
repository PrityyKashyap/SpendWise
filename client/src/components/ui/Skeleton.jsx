/**
 * Placeholder shaped like the content it replaces, so nothing shifts when the
 * real data lands (ARCHITECTURE.md §4.5).
 *
 * A sweeping shimmer rather than a pulsing block: a pulse fades the whole
 * surface in and out, which reads as "something is broken and retrying", while
 * a sweep reads as "something is arriving". The gradient is defined in
 * index.css so it can be switched off under prefers-reduced-motion.
 */
export default function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded-lg bg-canvas ${className}`} />;
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
