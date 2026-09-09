import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../../utils/money.js';

/**
 * Spending by category (IDEA.md §8).
 *
 * A donut rather than a full pie: the hole carries the total, so the chart
 * answers "how much, and on what?" in one glance instead of needing a caption.
 *
 * Slice colours come from each category record, so a category is the same
 * colour here as in its icon and its list row.
 */
export default function CategoryPieChart({ categories, total }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={categories}
            dataKey="total"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {categories.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const slice = payload[0].payload;
              return (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-sm">
                  <p className="text-xs font-medium text-ink">{slice.name}</p>
                  <p className="tabular mt-0.5 text-sm font-semibold text-ink">
                    {formatMoney(slice.total)}
                  </p>
                  <p className="text-xs text-ink-muted">{slice.percentage}% of spending</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centre label. pointer-events-none so it never blocks a slice hover. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-[11px] text-ink-muted">Total spent</p>
          <p className="tabular text-lg font-semibold text-ink">{formatMoney(total)}</p>
        </div>
      </div>
    </div>
  );
}
