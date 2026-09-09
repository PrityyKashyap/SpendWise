import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '../../utils/money.js';
import { formatMonthShort } from '../../utils/date.js';

/**
 * Income against expenses, month by month (IDEA.md §8).
 *
 * Grouped bars rather than stacked: the question is "did I earn more than I
 * spent?", and stacking would hide that by adding the two together.
 */
export default function IncomeExpenseChart({ series }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthShort}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          // Axis labels in thousands: full rupee amounts with paise would
          // consume a third of the chart's width.
          tickFormatter={(paise) => `${Math.round(paise / 100000)}k`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip cursor={{ fill: '#F8FAFC' }} content={<MoneyTooltip />} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
        />
        <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Expenses" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MoneyTooltip({ active, payload, label, labelFormatter = formatMonthShort }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-sm">
      <p className="mb-1 text-xs font-medium text-ink">{labelFormatter(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-ink-muted">{entry.name}</span>
          <span className="tabular ml-auto font-medium text-ink">
            {formatMoney(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}
