import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { getSummary, getSpending, getRecent } from '../services/dashboardService.js';
import { getInsights } from '../services/budgetService.js';
import { currentMonth, formatMonth, shiftMonth } from '../utils/date.js';
import SummaryCards from '../components/dashboard/SummaryCards.jsx';
import DebtSummary from '../components/dashboard/DebtSummary.jsx';
import InsightList from '../components/insights/InsightList.jsx';
import SpendingByCategory from '../components/dashboard/SpendingByCategory.jsx';
import RecentTransactions from '../components/dashboard/RecentTransactions.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Button from '../components/ui/Button.jsx';

/**
 * The main screen (IDEA.md §8).
 *
 * Ordered by §26's priority list: balance, income/expense summary, spending
 * breakdown, then recent transactions. Outstanding debts slot in at Phase 7.
 *
 * The cards animate in on a stagger, each one's delay set where it is used, so
 * the eye is walked down the page in the order the figures actually matter
 * rather than everything arriving at once.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());

  const summary = useFetch(() => getSummary(month), [month]);
  const spending = useFetch(() => getSpending(month), [month]);
  const recent = useFetch(() => getRecent(5), []);
  const insights = useFetch(() => getInsights(month), [month]);

  const isThisMonth = month === currentMonth();

  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="anim-rise">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Hi,{' '}
            {/* Gradient that drifts slowly across the name. Purely decorative —
                the text is real text, selectable and readable by a screen
                reader; only its fill is painted. */}
            <span
              className="text-shift bg-gradient-to-r from-brand via-brand-purple to-brand
                         bg-clip-text text-transparent"
            >
              {user?.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            Here is your money this month.
          </p>
        </div>

        <div className="anim-rise hidden gap-2 sm:flex" style={{ animationDelay: '80ms' }}>
          <Link to="/transactions/new?type=income">
            <Button variant="secondary" className="hover-lift">
              Add income
            </Button>
          </Link>
          <Link to="/transactions/new?type=expense">
            <Button className="hover-lift group shadow-lg shadow-brand/20">
              <Plus
                className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
                aria-hidden="true"
              />
              Add expense
            </Button>
          </Link>
        </div>
      </header>

      {/* Month switcher. Forward is disabled in the current month — there is
          nothing to see in the future, and letting people wander into empty
          months looks like a bug. */}
      <div
        className="anim-rise mb-4 inline-flex items-center gap-1 rounded-full border border-line
                   bg-surface p-1 shadow-sm shadow-slate-900/5"
        style={{ animationDelay: '40ms' }}
      >
        <MonthButton
          onClick={() => setMonth(shiftMonth(month, -1))}
          label="Previous month"
          icon={ChevronLeft}
        />
        <span className="min-w-36 text-center text-sm font-semibold text-ink">
          {formatMonth(month)}
        </span>
        <MonthButton
          onClick={() => setMonth(shiftMonth(month, 1))}
          label="Next month"
          icon={ChevronRight}
          disabled={isThisMonth}
        />
      </div>

      {summary.error ? (
        <ErrorState error={summary.error} onRetry={summary.refetch} />
      ) : (
        /*
         * Keyed on the month so changing it remounts the cards and replays the
         * entrance animation. The fetches live above this boundary, so the
         * remount costs a repaint — not a refetch.
         */
        <div key={month} className="space-y-4">
          <SummaryCards summary={summary.data} isLoading={summary.isLoading} />
          <DebtSummary summary={summary.data} isLoading={summary.isLoading} />
          <InsightList data={insights.data} isLoading={insights.isLoading} />
          <SpendingByCategory spending={spending.data} isLoading={spending.isLoading} />
          <RecentTransactions
            transactions={recent.data}
            isLoading={recent.isLoading}
            error={recent.error}
            onRetry={recent.refetch}
          />
        </div>
      )}
    </>
  );
}

function MonthButton({ onClick, label, icon: Icon, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition
                 duration-300 hover:bg-brand-soft hover:text-brand active:scale-90
                 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
