import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { SUMMARY, SPEND_SERIES, CATEGORIES, RECENT, inr } from './demoData.js';
import { MiniArea, MiniDonut, BudgetMeter } from './MiniChart.jsx';

/**
 * A mock of the real SpendWise dashboard, for the hero.
 *
 * Every number comes from demoData.js. This component makes no network calls
 * and touches no session — a landing page seen by logged-out strangers must
 * never be able to render someone's actual finances.
 */
export default function DashboardPreview() {
  const [balance, ...rest] = SUMMARY;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-surface
                 shadow-xl shadow-brand-deep/10"
      // Decorative composite: the surrounding copy carries the meaning, and
      // announcing forty fake rupee figures would be noise for a screen reader.
      role="img"
      aria-label="A preview of the SpendWise dashboard showing balance, spending trends, categories and budgets."
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-expense/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-i-owe/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-income/70" />
        </div>
        <span className="text-xs font-medium text-ink-muted">September 2026</span>
      </div>

      <div className="space-y-5 p-5" aria-hidden="true">
        {/* Headline balance + the three supporting figures. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-ink-muted">{balance.label}</p>
            <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-ink">
              {inr(balance.value)}
            </p>
          </div>
          {rest.map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-ink-muted">{item.label}</p>
              <p
                className={`tabular mt-1 text-base font-semibold ${
                  item.tone === 'income'
                    ? 'text-income'
                    : item.tone === 'expense'
                      ? 'text-expense'
                      : 'text-brand'
                }`}
              >
                {inr(item.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-canvas p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-ink-muted">Spending this month</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-income">
              <ArrowDownLeft className="h-3 w-3" />
              12% vs Aug
            </p>
          </div>
          <MiniArea values={SPEND_SERIES} className="mt-2 h-20" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Category breakdown */}
          <div>
            <p className="text-xs font-medium text-ink-muted">By category</p>
            <div className="mt-2 flex items-center gap-3">
              <MiniDonut segments={CATEGORIES} className="h-20 w-20 shrink-0" />
              <ul className="min-w-0 flex-1 space-y-1.5">
                {CATEGORIES.slice(0, 3).map((category) => (
                  <li key={category.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate text-ink-muted">{category.name}</span>
                    <span className="tabular ml-auto font-medium text-ink">
                      {category.share}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent transactions */}
          <div>
            <p className="text-xs font-medium text-ink-muted">Recent</p>
            <ul className="mt-2 divide-y divide-line">
              {RECENT.map((item) => {
                const isIncome = item.amount > 0;
                return (
                  <li key={item.name} className="flex items-center gap-2.5 py-1.5">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                        isIncome ? 'bg-income/10 text-income' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-ink">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-ink-muted">{item.when}</span>
                    </span>
                    <span
                      className={`tabular text-xs font-semibold ${
                        isIncome ? 'text-income' : 'text-ink'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {inr(Math.abs(item.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-line p-3">
          <BudgetMeter name="Food budget" spent={4200} limit={5000} format={inr} />
        </div>
      </div>
    </div>
  );
}
