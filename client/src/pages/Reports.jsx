import { useState } from 'react';
import { FileText, Info } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { getReport } from '../services/analyticsService.js';
import { currentMonth, formatMonth } from '../utils/date.js';
import { formatMoney } from '../utils/money.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import MonthPicker from '../components/analytics/MonthPicker.jsx';
import ComparisonStat from '../components/analytics/ComparisonStat.jsx';
import Card from '../components/ui/Card.jsx';
import CategoryIcon from '../components/ui/CategoryIcon.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

/** The monthly financial report (IDEA.md §19). */
export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const { data: report, error, isLoading, refetch } = useFetch(() => getReport(month), [month]);

  return (
    <>
      <PageHeader
        title="Monthly report"
        subtitle="A summary of the month, compared with the one before."
        action={<MonthPicker month={month} onChange={setMonth} />}
      />

      {isLoading && <Skeleton className="h-96" />}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {report && !isLoading && (
        report.transactionCount === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title={`Nothing recorded in ${formatMonth(month)}`}
              description="Add income or expenses for this month and the report will fill in."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {report.isPartialMonth && (
              // Without this, a partial month's totals look like a completed
              // month's and invite a false comparison.
              <p className="flex items-start gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {formatMonth(month)} is still in progress — figures cover the first{' '}
                {report.daysCounted} day{report.daysCounted === 1 ? '' : 's'}, and averages are
                calculated over those days rather than the whole month.
              </p>
            )}

            <Card className="divide-y divide-line px-5">
              <ComparisonStat
                label="Total income"
                value={report.totalIncome}
                change={report.comparison.incomeChange}
              />
              <ComparisonStat
                label="Total expenses"
                value={report.totalExpenses}
                change={report.comparison.expenseChange}
                isGoodWhenDown
              />
              <ComparisonStat
                label="Savings"
                value={report.savings}
                change={report.comparison.savingsChange}
              />
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <p className="text-xs text-ink-muted">Average daily spending</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {formatMoney(report.averageDailySpend)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  over {report.daysCounted} day{report.daysCounted === 1 ? '' : 's'}
                  {report.comparison.previous.averageDailySpend > 0 &&
                    ` · was ${formatMoney(report.comparison.previous.averageDailySpend)}`}
                </p>
              </Card>

              <Card className="p-5">
                <p className="text-xs text-ink-muted">Savings rate</p>
                <p className="tabular mt-1 text-xl font-semibold text-ink">
                  {report.savingsRate === null ? '—' : `${report.savingsRate}%`}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {report.savingsRate === null
                    ? 'No income recorded this month'
                    : 'of income kept'}
                </p>
              </Card>
            </div>

            {report.topCategory && (
              <Card className="flex items-center gap-3 p-5">
                <CategoryIcon category={report.topCategory} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">Highest spending category</p>
                  <p className="text-sm font-semibold text-ink">{report.topCategory.name}</p>
                </div>
                <p className="tabular text-lg font-semibold text-ink">
                  {formatMoney(report.topCategory.total)}
                </p>
              </Card>
            )}

            {!report.comparison.hasPreviousData && (
              <p className="text-center text-xs text-ink-muted">
                No data for {formatMonth(report.previousMonth)}, so there is nothing to compare
                against yet.
              </p>
            )}
          </div>
        )
      )}
    </>
  );
}
