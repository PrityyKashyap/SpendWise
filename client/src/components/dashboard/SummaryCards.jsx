import { ArrowDownRight, ArrowUpRight, Receipt, Wallet } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import CountUpMoney from '../motion/CountUp.jsx';
import Tilt from '../motion/Tilt.jsx';

/**
 * The headline figures (IDEA.md §8).
 *
 * Ordered per §26: balance first, then income and expenses. Balance gets the
 * dark treatment and the full width because "how much do I have?" is the
 * question the dashboard exists to answer — everything else on the screen is
 * context for that one number.
 */
export default function SummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { balance, totalIncome, totalExpenses, breakdown } = summary;
  const isNegative = balance < 0;

  // Share of income already spent. Guarded because a month with income of zero
  // is perfectly normal (it just has not arrived yet) and must not divide by 0.
  const spentRatio =
    totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;

  return (
    <div className="space-y-3">
      <Tilt className="anim-rise">
        <div
          className="sheen-host relative overflow-hidden rounded-3xl bg-brand-deep p-6
                     shadow-xl shadow-brand-deep/25"
        >
          {/* Two drifting colour fields on different periods, so the background
              never visibly loops. Both are decorative. */}
          <div
            aria-hidden="true"
            className="aurora-a pointer-events-none absolute -left-16 -top-24 h-72 w-72
                       bg-brand/50 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="aurora-b pointer-events-none absolute -bottom-28 -right-10 h-72 w-72
                       bg-brand-purple/40 blur-3xl"
          />
          <span className="sheen" aria-hidden="true" />

          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Balance this month
            </div>

            <p
              className={`mt-2 text-4xl font-semibold tracking-tight sm:text-5xl ${
                isNegative ? 'text-[#FFB4B4]' : 'text-white'
              }`}
            >
              <CountUpMoney value={balance} duration={1100} />
            </p>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
              <span className="inline-flex items-center gap-1">
                <Receipt className="h-3 w-3" aria-hidden="true" />
                {breakdown.transactionCount} transaction
                {breakdown.transactionCount === 1 ? '' : 's'} recorded
              </span>
              {isNegative && <span>· you have spent more than you earned</span>}
            </p>

            {/* How much of this month's income is already gone. */}
            {totalIncome > 0 && (
              <div className="mt-5">
                <div className="flex items-baseline justify-between text-[11px] font-medium text-white/60">
                  <span>Spent</span>
                  <span className="tabular">{spentRatio}% of income</span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-valuenow={spentRatio}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Share of income spent this month"
                >
                  <span
                    className="grow-x block h-full rounded-full bg-gradient-to-r
                               from-[#C9C0FF] to-white"
                    style={{ width: `${spentRatio}%`, animationDelay: '260ms' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Tilt>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={ArrowDownRight}
          label="Income"
          value={totalIncome}
          tone="text-income"
          ring="bg-income/10"
          bar="bg-income"
          fill={100}
          delay="70ms"
        />
        <Stat
          icon={ArrowUpRight}
          label="Expenses"
          value={totalExpenses}
          tone="text-expense"
          ring="bg-expense/10"
          bar="bg-expense"
          fill={spentRatio}
          delay="140ms"
          note={
            breakdown.groupExpenseShare > 0
              ? `incl. ${formatMoney(breakdown.groupExpenseShare)} group share`
              : null
          }
        />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, ring, bar, fill, note, delay }) {
  return (
    <Card
      className="hover-lift anim-rise p-4 hover:shadow-lg hover:shadow-brand-deep/10"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
        <span className={`grid h-6 w-6 place-items-center rounded-full ${ring}`}>
          <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden="true" />
        </span>
        {label}
      </div>

      <p className={`mt-2 text-xl font-semibold ${tone}`}>
        <CountUpMoney value={value} duration={900} />
      </p>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
        <span
          className={`grow-x block h-full rounded-full ${bar}`}
          style={{ width: `${fill}%`, animationDelay: '320ms' }}
        />
      </div>

      {note && <p className="mt-2 text-[11px] text-ink-muted">{note}</p>}
    </Card>
  );
}
