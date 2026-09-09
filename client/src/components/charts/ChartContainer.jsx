import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';

/**
 * Shared frame for a chart: title, optional caption, and the loading and empty
 * states every chart needs (ARCHITECTURE.md §4.5).
 *
 * Centralised so no chart can accidentally ship without them.
 */
export default function ChartContainer({
  title,
  caption,
  isLoading,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  height = 220,
  children,
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {caption && <p className="mt-0.5 text-xs text-ink-muted">{caption}</p>}
      </div>

      {isLoading ? (
        <Skeleton style={{ height }} className="w-full" />
      ) : isEmpty ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        children
      )}
    </Card>
  );
}
