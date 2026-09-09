import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '../../utils/money.js';

/**
 * Spending for each day of a month (IDEA.md §8, §22).
 *
 * Every day is plotted, including days with nothing spent, so the gaps
 * themselves are visible — a chart that silently drops empty days would make
 * occasional spending look continuous.
 */
export default function DailySpendChart({ days, highestSpendingDay }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={days} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="day"
          // A tick per day is unreadable on a phone; every fifth is enough to
          // locate a bar in the month.
          interval={4}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(paise) => (paise >= 100000 ? `${Math.round(paise / 100000)}k` : paise / 100)}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip
          cursor={{ fill: '#F8FAFC' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload;
            return (
              <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-sm">
                <p className="text-xs font-medium text-ink">Day {point.day}</p>
                <p className="tabular mt-0.5 text-sm font-semibold text-expense">
                  {formatMoney(point.expense)}
                </p>
                {point.income > 0 && (
                  <p className="tabular text-xs text-income">+{formatMoney(point.income)} in</p>
                )}
              </div>
            );
          }}
        />
        <Bar dataKey="expense" radius={[3, 3, 0, 0]}>
          {days.map((point) => (
            <Cell
              key={point.date}
              // The heaviest day is highlighted so the outlier is findable at a
              // glance rather than by hovering every bar.
              fill={point.day === highestSpendingDay?.day ? '#E11D48' : '#FDA4AF'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
