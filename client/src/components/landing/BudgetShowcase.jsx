import { Link } from 'react-router-dom';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';
import { BudgetMeter } from './MiniChart.jsx';
import { BUDGETS, inr } from './demoData.js';

export default function BudgetShowcase() {
  return (
    <Section
      eyebrow="Budgets"
      title="Know before you overspend."
      subtitle="A limit per category, and a live read on how much room is left in each one."
    >
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-slate-900/5">
            {BUDGETS.map((budget) => (
              <BudgetMeter key={budget.name} {...budget} format={inr} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="rounded-2xl border border-i-owe/25 bg-i-owe/5 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-i-owe text-white">
              <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-lg font-semibold text-ink">
              You&apos;re approaching your Food budget.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              ₹4,200 of ₹5,000 used with a week still to go. A warning while you can still act on
              it is worth more than a perfect report at the end of the month.
            </p>

            <Link
              to="/budgets"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3
                         text-sm font-semibold text-white transition hover:bg-brand-purple
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Create a budget
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
