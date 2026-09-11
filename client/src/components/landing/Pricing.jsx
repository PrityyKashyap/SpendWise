import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';

/**
 * Pricing.
 *
 * The navbar in the brief lists a Pricing link, so the section it points at has
 * to exist — a nav item that scrolls nowhere is a broken link. What it says is
 * deliberately limited to what is true today: SpendWise is free and has no paid
 * tier. Inventing Pro and Team columns with invented prices would be the same
 * class of fabrication the brief rules out for user counts and testimonials.
 */
const INCLUDED = [
  'Unlimited income and expense tracking',
  'Categories, budgets and monthly reports',
  'Full analytics — trends, comparisons, breakdowns',
  'Unlimited groups and shared expenses',
  'Optimised settlements and payment reminders',
];

export default function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Free while we build it."
      subtitle="SpendWise is in active development. There is no paid plan, no trial timer and nothing held back."
    >
      <Reveal className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl border border-brand/20 bg-surface shadow-xl shadow-brand-deep/10">
          <div className="bg-brand-soft/60 px-8 py-7 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Free</p>
            <p className="mt-3">
              <span className="text-5xl font-semibold tracking-tight text-ink">₹0</span>
              <span className="ml-1 text-sm text-ink-muted">/ month</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">Everything, for everyone.</p>
          </div>

          <div className="px-8 py-7">
            <ul className="space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-income text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-7 block rounded-xl bg-brand px-5 py-3.5 text-center text-sm font-semibold
                         text-white transition hover:bg-brand-purple focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Get Started Free
            </Link>
            <p className="mt-3 text-center text-xs text-ink-muted">No credit card required</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
