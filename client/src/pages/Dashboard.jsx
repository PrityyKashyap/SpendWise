import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Hi, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Here is your money this month.</p>
        </div>

        <div className="hidden gap-2 sm:flex">
          <Link to="/transactions/new?type=income">
            <Button variant="secondary">Add income</Button>
          </Link>
          <Link to="/transactions/new?type=expense">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add expense
            </Button>
          </Link>
        </div>
      </header>

      {/* Month switcher. Forward is disabled in the current month — there is
          nothing to see in the future, and letting people wander into empty
          months looks like a bug. */}
      <div className="mb-4 flex items-center gap-1">
        <MonthButton
          onClick={() => setMonth(shiftMonth(month, -1))}
          label="Previous month"
          icon={ChevronLeft}
        />
        <span className="min-w-40 text-center text-sm font-medium text-ink">
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
        <div className="space-y-4">
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
      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-muted
                 transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed
                 disabled:opacity-40"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
