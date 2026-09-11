import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';
import { TRIP, inr } from './demoData.js';

const TOTAL = TRIP.expenses.reduce((sum, expense) => sum + expense.amount, 0);
const PER_HEAD = Math.round(TOTAL / TRIP.members.length);

export default function GroupShowcase() {
  return (
    <Section
      id="split"
      eyebrow="Group expenses"
      title="Split expenses without the awkward math."
      subtitle="Add what everyone paid. SpendWise works out who owes whom, and reduces it to the fewest payments."
      className="bg-surface"
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* The group as it looks in the app */}
        <Reveal>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-slate-900/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-ink">{TRIP.name}</h3>
                <p className="text-xs text-ink-muted">{TRIP.members.length} members</p>
              </div>
              <div className="flex -space-x-2">
                {TRIP.members.map((member) => (
                  <span
                    key={member}
                    title={member}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-surface
                               bg-brand-soft text-xs font-semibold text-brand"
                  >
                    {member[0]}
                  </span>
                ))}
              </div>
            </div>

            <ul className="mt-5 divide-y divide-line">
              {TRIP.expenses.map((expense) => (
                <li key={expense.label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-ink">{expense.label}</span>
                  <span className="tabular text-sm font-semibold text-ink">
                    {inr(expense.amount)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
              <span className="text-sm font-medium text-ink">Total</span>
              <span className="tabular text-sm font-semibold text-ink">{inr(TOTAL)}</span>
            </div>
            <p className="tabular mt-2 text-xs text-ink-muted">
              {inr(PER_HEAD)} per person, split equally
            </p>
          </div>
        </Reveal>

        {/* The answer */}
        <Reveal delay={90}>
          <div className="rounded-2xl border border-brand/20 bg-brand-soft/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Optimised settlement
            </p>

            <div className="mt-4 rounded-xl bg-surface p-5 shadow-sm shadow-brand-deep/5">
              <p className="text-lg font-semibold text-ink">
                {TRIP.settlement.from} owe {TRIP.settlement.to}{' '}
                <span className="tabular text-brand">{inr(TRIP.settlement.amount)}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                That single payment clears the whole trip. No chains of small transfers, no one
                keeping a tally in their notes app.
              </p>
            </div>

            <ul className="mt-5 space-y-2.5">
              {[
                'Split equally, by exact amounts, by percentage or by shares',
                'Rounding handled to the paisa — the totals always reconcile',
                'Add people who have not signed up yet',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-ink">
                  <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-income text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <Link
              to="/groups"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3
                         text-sm font-semibold text-white transition hover:bg-brand-purple
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Try group expenses
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
