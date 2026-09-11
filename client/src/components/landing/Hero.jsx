import { Link } from 'react-router-dom';
import { ArrowRight, PiggyBank, Repeat, ShieldCheck } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import DashboardPreview from './DashboardPreview.jsx';

/**
 * Small drifting stat cards around the preview.
 *
 * Hidden below xl: on a narrow screen they would either cover the dashboard
 * they are meant to annotate, or force it to shrink to stamp size. Mobile shows
 * the same three claims as a plain row underneath instead — the content
 * survives, the decoration is what gets dropped.
 */
function FloatingCard({ icon: Icon, children, className, animation }) {
  return (
    <div
      className={`absolute hidden items-center gap-2 rounded-xl border border-line bg-surface/95
                  px-3.5 py-2.5 text-xs font-semibold text-ink shadow-lg shadow-brand-deep/10
                  backdrop-blur xl:flex ${animation} ${className}`}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4 shrink-0 text-brand" />
      {children}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16">
      {/* Brand wash. Two soft blooms rather than a flat tint, so the top of the
          page has some depth without resorting to a busy background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[36rem]
                   bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-brand-soft),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full
                   bg-brand/5 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div className="max-w-xl">
          <Reveal>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand/15
                         bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"
            >
              Track → Analyze → Plan → Split → Settle
            </span>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Take control of your money.
              <span className="block text-brand">Without the spreadsheet.</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-pretty text-base leading-relaxed text-ink-muted sm:text-lg">
              Track spending, understand your habits, split expenses, manage budgets, and build
              better financial decisions — all in one place.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand
                           px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25
                           transition hover:-translate-y-0.5 hover:bg-brand-purple hover:shadow-xl
                           hover:shadow-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-brand"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line
                           bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition
                           hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Explore Features
              </a>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-5 text-xs text-ink-muted">
              No credit card required • Free to get started
            </p>
          </Reveal>
        </div>

        {/* Preview column */}
        <Reveal delay={140} className="relative">
          <DashboardPreview />

          <FloatingCard
            icon={PiggyBank}
            animation="float-slow"
            className="-left-12 top-[34%] [animation-delay:-1.2s]"
          >
            ₹2,450 saved this month
          </FloatingCard>
          <FloatingCard
            icon={ShieldCheck}
            animation="float-fast"
            className="-right-6 -top-5"
          >
            You&apos;re under budget 🎉
          </FloatingCard>
          <FloatingCard
            icon={Repeat}
            animation="float-slow"
            className="-right-8 -bottom-6 [animation-delay:-2.4s]"
          >
            3 subscriptions detected
          </FloatingCard>
        </Reveal>
      </div>

      {/* Mobile/tablet stand-in for the floating cards. */}
      <div className="relative mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-2 xl:hidden">
        {[
          { icon: PiggyBank, text: '₹2,450 saved this month' },
          { icon: ShieldCheck, text: "You're under budget 🎉" },
          { icon: Repeat, text: '3 subscriptions detected' },
        ].map(({ icon: Icon, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface
                       px-3 py-1.5 text-xs font-medium text-ink-muted"
          >
            <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
