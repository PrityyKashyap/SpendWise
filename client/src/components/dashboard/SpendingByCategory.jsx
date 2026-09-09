import { ChartPie } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import Card from '../ui/Card.jsx';
import CategoryIcon from '../ui/CategoryIcon.jsx';
import { lazy, Suspense } from 'react';
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
  if (isLoading) return <Skeleton className="h-72" />;

  if (!spending?.categories?.length) {
    return (
      <Card>
        <EmptyState
          icon={ChartPie}
          title="No spending this month"
          description="Add an expense and your category breakdown will appear here."
        />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink">Where your money went</h2>

      {/* The fallback matches the chart's height so the legend below it does
          not jump when the chunk finishes loading. */}
      <Suspense fallback={<Skeleton className="h-[200px]" />}>
        <CategoryPieChart categories={spending.categories} total={spending.total} />
      </Suspense>

      <ul className="mt-4 space-y-1">
        {spending.categories.map((category) => (
          <li key={category.categoryId} className="flex items-center gap-3 py-1">
            <CategoryIcon category={category} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{category.name}</span>
            <span className="tabular text-xs text-ink-muted">{category.percentage}%</span>
            <span className="tabular w-24 text-right text-sm font-medium text-ink">
              {formatMoney(category.total)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
