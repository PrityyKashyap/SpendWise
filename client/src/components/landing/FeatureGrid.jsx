import { BarChart3, FileText, Handshake, Target, Users, Wallet } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';
import { inr } from './demoData.js';

/* ---- Miniature UI previews -------------------------------------------------
 * Each card carries a tiny abstraction of the real screen it describes. They
 * are suggestions of an interface, not screenshots: a legible screenshot would
 * need to be far larger than a card, and a shrunken one just looks like dirt.
 * All are decorative — the card's own text carries the meaning.
 * -------------------------------------------------------------------------- */

function TrackingPreview() {
  return (
    <div className="space-y-2">
      {[
        ['Groceries', -1240],
        ['Salary', 45000],
        ['Fuel', -2200],
      ].map(([label, amount]) => (
        <div key={label} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${amount > 0 ? 'bg-income' : 'bg-brand'}`} />
          <span className="truncate text-[11px] text-ink-muted">{label}</span>
          <span
            className={`tabular ml-auto text-[11px] font-semibold ${
              amount > 0 ? 'text-income' : 'text-ink'
            }`}
          >
            {amount > 0 ? '+' : '−'}
            {inr(Math.abs(amount))}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="flex h-[4.6rem] items-end gap-1.5">
      {[38, 62, 48, 80, 56, 94, 70].map((height, index) => (
        <span
          key={height}
          className="rise-bar flex-1 rounded-t bg-brand/80"
          style={{ height: `${height}%`, animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

function BudgetsPreview() {
  return (
    <div className="space-y-2.5">
      {[
        ['Food', 84, 'bg-i-owe'],
        ['Transport', 52, 'bg-brand'],
        ['Shopping', 31, 'bg-brand/60'],
      ].map(([label, pct, tone]) => (
        <div key={label}>
          <div className="flex justify-between text-[11px] text-ink-muted">
            <span>{label}</span>
            <span className="tabular">{pct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
            <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupsPreview() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {['Y', 'A', 'R', 'J'].map((initial, index) => (
          <span
            key={initial}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-canvas
                       bg-brand text-[11px] font-semibold text-white"
            style={{ opacity: 1 - index * 0.14 }}
          >
            {initial}
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-ink">Weekend Trip</p>
        <p className="tabular text-[11px] text-ink-muted">{inr(8800)} · 4 people</p>
      </div>
    </div>
  );
}

function SettlementPreview() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-2">
        <span className="text-[11px] text-ink-muted">You → Rahul</span>
        <span className="tabular text-[11px] font-semibold text-brand">{inr(600)}</span>
      </div>
      <p className="text-center text-[10px] font-medium text-income">
        3 payments simplified to 1
      </p>
    </div>
  );
}

function ReportsPreview() {
  return (
    <div className="rounded-lg bg-surface p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        September
      </p>
      <p className="tabular mt-1 text-lg font-semibold text-ink">{inr(18420)}</p>
      <p className="text-[11px] text-income">12% less than August</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: Wallet,
    title: 'Smart Expense Tracking',
    body: 'Log income and expenses in seconds, sorted into categories that actually match how you spend.',
    Preview: TrackingPreview,
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    body: 'Trends, comparisons and category breakdowns that show where the money really goes.',
    Preview: AnalyticsPreview,
  },
  {
    icon: Target,
    title: 'Smart Budgets',
    body: 'Per-category limits with live progress, so you know before you overspend rather than after.',
    Preview: BudgetsPreview,
  },
  {
    icon: Users,
    title: 'Group Expenses',
    body: 'Shared bills split equally, by exact amount, by percentage or by shares — always to the paisa.',
    Preview: GroupsPreview,
  },
  {
    icon: Handshake,
    title: 'Smart Settlement',
    body: 'Who owes whom, reduced to the fewest possible payments before anyone opens a UPI app.',
    Preview: SettlementPreview,
  },
  {
    icon: FileText,
    title: 'Monthly Reports',
    body: 'A clear month-end summary of what came in, what went out, and what changed.',
    Preview: ReportsPreview,
  },
];

export default function FeatureGrid() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title="One app. Your entire financial picture."
      subtitle="Everything you need to track, understand and share your money — without stitching together four different tools."
      className="bg-surface"
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body, Preview }, index) => (
          <Reveal key={title} delay={(index % 3) * 80}>
            <article
              className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6
                         transition duration-300 hover:-translate-y-1 hover:border-brand/25
                         hover:shadow-xl hover:shadow-brand-deep/10"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand
                           transition-colors duration-300 group-hover:bg-brand group-hover:text-white"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{body}</p>

              <div className="mt-5 rounded-xl bg-canvas p-3" aria-hidden="true">
                <Preview />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
