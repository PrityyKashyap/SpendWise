import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';
import { HEALTH } from './demoData.js';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MoneyHealth() {
  const dash = (HEALTH.score / 100) * CIRCUMFERENCE;

  return (
    <Section
      eyebrow="Money health"
      title="Your financial health, at a glance."
      subtitle="Four habits, scored together, so progress is something you can actually see."
      className="bg-surface"
    >
      <Reveal>
        <div
          className="mx-auto grid max-w-4xl items-center gap-10 rounded-3xl border border-brand/15
                     bg-gradient-to-br from-brand-soft/70 to-surface p-8 sm:p-10 md:grid-cols-[auto_1fr]"
        >
          {/* Score ring */}
          <div className="relative mx-auto h-44 w-44 shrink-0">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="var(--color-brand)"
                strokeOpacity="0.15"
                strokeWidth="11"
              />
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="var(--color-brand)"
                strokeWidth="11"
                strokeLinecap="round"
                // Not .draw-line: that class sets stroke-dasharray in CSS, and CSS
                // beats an SVG presentation attribute — so the ring rendered as a
                // full circle regardless of the score. This keeps the dash array
                // constant and animates only the offset, which is also the correct
                // way to draw an arc on.
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE - dash}
                className="draw-ring"
                style={{ '--ring-from': CIRCUMFERENCE, '--ring-to': CIRCUMFERENCE - dash }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="tabular text-4xl font-semibold tracking-tight text-ink">
                  {HEALTH.score}
                </p>
                <p className="text-sm font-semibold text-income">{HEALTH.verdict}</p>
              </div>
            </div>
          </div>

          <div>
            <ul className="space-y-4">
              {HEALTH.metrics.map((metric, index) => (
                <li key={metric.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{metric.label}</span>
                    <span className="tabular text-sm font-semibold text-ink">{metric.value}</span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-surface"
                    role="progressbar"
                    aria-valuenow={metric.value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={metric.label}
                  >
                    <span
                      className="block h-full rounded-full bg-brand transition-[width] duration-700"
                      style={{ width: `${metric.value}%`, transitionDelay: `${index * 90}ms` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-medium text-ink">
              You&apos;re building better money habits.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
