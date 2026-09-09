import { lazy, Suspense, useState } from 'react';
import { ChartColumn, TrendingUp, CalendarDays } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { getTrends, getDailyFlow } from '../services/analyticsService.js';
import { getSpending } from '../services/dashboardService.js';
import { currentMonth } from '../utils/date.js';
import { formatMoney } from '../utils/money.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import MonthPicker from '../components/analytics/MonthPicker.jsx';
import ChartContainer from '../components/charts/ChartContainer.jsx';
import SpendingByCategory from '../components/dashboard/SpendingByCategory.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

// Charts are lazy so recharts stays out of the initial bundle (Phase 3 note).
const IncomeExpenseChart = lazy(() => import('../components/charts/IncomeExpenseChart.jsx'));
const SavingsTrendChart = lazy(() => import('../components/charts/SavingsTrendChart.jsx'));
const DailySpendChart = lazy(() => import('../components/charts/DailySpendChart.jsx'));

const ChartFallback = ({ height = 220 }) => <Skeleton style={{ height }} className="w-full" />;

/** Spending analysis and trends (IDEA.md §8). */
export default function Analytics() {
  const [month, setMonth] = useState(currentMonth());

  const trends = useFetch(() => getTrends({ months: 6 }), []);
  const daily = useFetch(() => getDailyFlow(month), [month]);
  const spending = useFetch(() => getSpending(month), [month]);

  const series = trends.data?.series ?? [];
  // A series padded with zero months is not "empty", but it has nothing worth
  // charting until at least one month carries data.
  const hasTrendData = series.some((point) => point.income > 0 || point.expense > 0);

  if (trends.error) return <ErrorState error={trends.error} onRetry={trends.refetch} />;

  return (
    <>
      <PageHeader title="Analytics" subtitle="How your spending is changing over time." />

      <div className="space-y-4">
        <ChartContainer
          title="Income vs expenses"
          caption="Last 6 months"
          isLoading={trends.isLoading}
          isEmpty={!hasTrendData}
          emptyIcon={ChartColumn}
          emptyTitle="Not enough data yet"
          emptyDescription="Add income and expenses and your monthly comparison will appear here."
        >
          <Suspense fallback={<ChartFallback />}>
            <IncomeExpenseChart series={series} />
          </Suspense>
        </ChartContainer>

        <ChartContainer
          title="Savings trend"
          caption="Income minus expenses, month by month"
          isLoading={trends.isLoading}
          isEmpty={!hasTrendData}
          emptyIcon={TrendingUp}
          emptyTitle="No savings history yet"
          emptyDescription="Once you have a month of data, your savings trend appears here."
          height={200}
        >
          <Suspense fallback={<ChartFallback height={200} />}>
            <SavingsTrendChart series={series} />
          </Suspense>
        </ChartContainer>

        <div className="flex items-center justify-between gap-3 pt-2">
          <h2 className="text-sm font-semibold text-ink">A closer look at one month</h2>
          <MonthPicker month={month} onChange={setMonth} />
        </div>

        <ChartContainer
          title="Daily spending"
          caption={
            daily.data?.highestSpendingDay
              ? `Highest: ${formatMoney(daily.data.highestSpendingDay.expense)} on day ${daily.data.highestSpendingDay.day}`
              : 'Every day of the month'
          }
          isLoading={daily.isLoading}
          isEmpty={!daily.data?.totalExpense}
          emptyIcon={CalendarDays}
          emptyTitle="No spending this month"
          emptyDescription="Days you spend money will show up as bars here."
          height={200}
        >
          <Suspense fallback={<ChartFallback height={200} />}>
            <DailySpendChart
              days={daily.data?.days ?? []}
              highestSpendingDay={daily.data?.highestSpendingDay}
            />
          </Suspense>
        </ChartContainer>

        <SpendingByCategory spending={spending.data} isLoading={spending.isLoading} />
      </div>
    </>
  );
}
