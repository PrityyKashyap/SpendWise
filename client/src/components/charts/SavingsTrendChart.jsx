import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { formatMonthShort } from '../../utils/date.js';
import { MoneyTooltip } from './IncomeExpenseChart.jsx';

/**
 * Savings over time (IDEA.md §8).
 *
 * A zero reference line is drawn because savings can go negative, and without
 * it a month where you overspent looks merely "low" rather than below zero.
 */
export default function SavingsTrendChart({ series }) {
  const hasNegative = series.some((point) => point.savings < 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthShort}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(paise) => `${Math.round(paise / 100000)}k`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        {hasNegative && <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="2 2" />}
        <Tooltip content={<MoneyTooltip />} />
        <Area
          type="monotone"
          dataKey="savings"
          name="Savings"
          stroke="#059669"
          strokeWidth={2}
          fill="url(#savingsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
