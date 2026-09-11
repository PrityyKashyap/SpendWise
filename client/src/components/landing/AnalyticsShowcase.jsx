import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';
import { MiniArea, MiniBars, MiniDonut } from './MiniChart.jsx';
import { CATEGORIES, MONTHLY, SPEND_SERIES, inr } from './demoData.js';

/** One panel of the analytics wall. */
function Panel({ title, caption, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 transition duration-300
                  hover:border-brand/25 hover:shadow-lg hover:shadow-brand-deep/10 ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {caption && <span className="text-xs text-ink-muted">{caption}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function AnalyticsShowcase() {
  const thisMonth = MONTHLY[MONTHLY.length - 1];
  const saved = thisMonth.income - thisMonth.expense;

  return (
    <Section
      id="analytics"
      eyebrow="Analytics"
      title="See where your money is actually going."
      subtitle="Not a wall of numbers — the four views that answer the questions you actually have."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Panel title="Income vs Expenses" caption="Last 6 months" className="h-full">
            <MiniBars data={MONTHLY} />
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-income/80" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Expenses
              </span>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={80}>
          <Panel title="Spending by Category" caption="September" className="h-full">
            <div className="flex items-center gap-4">
              <MiniDonut segments={CATEGORIES} className="h-24 w-24 shrink-0" />
              <ul className="min-w-0 flex-1 space-y-1.5">
                {CATEGORIES.slice(0, 4).map((category) => (
                  <li key={category.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate text-ink-muted">{category.name}</span>
                    <span className="tabular ml-auto font-medium text-ink">{category.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={120}>
          <Panel title="Savings Trend" caption="This month">
            <p className="tabular text-2xl font-semibold text-ink">{inr(saved)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-income">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              Saved this month
            </p>
            <MiniArea values={SPEND_SERIES} className="mt-3 h-16" stroke="var(--color-income)" />
          </Panel>
        </Reveal>

        <Reveal delay={160} className="lg:col-span-2">
          <Panel title="Monthly Comparison" caption="September vs August" className="h-full">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Expenses', now: 18420, was: 20300 },
                { label: 'Income', now: 45000, was: 45000 },
                { label: 'Savings', now: 26580, was: 24700 },
              ].map(({ label, now, was }) => {
                const delta = now - was;
                const pct = was === 0 ? 0 : Math.round((delta / was) * 100);
                // For expenses, down is good; for income and savings, up is.
                const isGood = label === 'Expenses' ? delta <= 0 : delta >= 0;
                return (
                  <div key={label} className="rounded-xl bg-canvas p-4">
                    <p className="text-xs text-ink-muted">{label}</p>
                    <p className="tabular mt-1 text-lg font-semibold text-ink">{inr(now)}</p>
                    <p
                      className={`tabular mt-0.5 text-xs font-medium ${
                        pct === 0 ? 'text-ink-muted' : isGood ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {pct === 0 ? 'No change' : `${pct > 0 ? '+' : ''}${pct}% vs Aug`}
                    </p>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Reveal>
      </div>

      <Reveal className="mt-10 text-center">
        <Link
          to="/analytics"
          className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface
                     px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand/30
                     hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand"
        >
          Explore analytics
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </Section>
  );
}
