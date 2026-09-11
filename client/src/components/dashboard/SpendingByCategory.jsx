import { lazy, Suspense } from 'react';
import { ChartPie } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import Card from '../ui/Card.jsx';
import CategoryIcon from '../ui/CategoryIcon.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';

/**
 * The charting library is around a megabyte of JavaScript and only the
 * dashboard uses it. Loading it lazily keeps it out of the initial bundle, so
 * login, register and the transaction list do not pay for a chart they never
 * render.
 */
const CategoryPieChart = lazy(() => import('../charts/CategoryPieChart.jsx'));

/** Donut chart plus a ranked legend, so the numbers are readable exactly. */
export default function SpendingByCategory({ spending, isLoading }) {
  if (isLoading) return <Skeleton className="h-72 rounded-2xl" />;

  if (!spending?.categories?.length) {
    return (
      <Card className="anim-rise" style={{ animationDelay: '350ms' }}>
        <EmptyState
          icon={ChartPie}
          title="No spending this month"
          description="Add an expense and your category breakdown will appear here."
        />
      </Card>
    );
  }

  // The legend bars are scaled against the biggest category, not against the
  // total. Against the total, a month split across eight categories renders as
  // eight near-invisible slivers.
  const largest = Math.max(...spending.categories.map((category) => category.total));

  return (
    <Card className="anim-rise p-5" style={{ animationDelay: '350ms' }}>
      <h2 className="text-sm font-semibold text-ink">Where your money went</h2>

      {/* The fallback matches the chart's height so the legend below it does
          not jump when the chunk finishes loading. */}
      <Suspense fallback={<Skeleton className="h-[200px]" />}>
        <CategoryPieChart categories={spending.categories} total={spending.total} />
      </Suspense>

      <ul className="mt-4 space-y-2.5">
        {spending.categories.map((category, index) => (
          <li key={category.categoryId} className="group">
            <div className="flex items-center gap-3">
              <span className="transition-transform duration-300 group-hover:scale-110">
                <CategoryIcon category={category} size="sm" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{category.name}</span>
              <span className="tabular text-xs text-ink-muted">{category.percentage}%</span>
              <span className="tabular w-24 text-right text-sm font-medium text-ink">
                {formatMoney(category.total)}
              </span>
            </div>

            {/* Each bar starts a beat after the one above it, so the ranking
                reads top-down as it draws. */}
            <div className="ml-10 mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
              <span
                className="grow-x block h-full rounded-full"
                style={{
                  width: `${Math.max(3, (category.total / largest) * 100)}%`,
                  backgroundColor: category.color ?? 'var(--color-brand)',
                  animationDelay: `${420 + index * 70}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
