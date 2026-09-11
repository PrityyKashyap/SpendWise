import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';

export default function FinalCTA() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-brand-deep px-6 py-16 text-center sm:px-12">
          {/* Brand bloom, kept low-contrast so the type stays the loudest thing. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0
                       bg-[radial-gradient(60%_70%_at_50%_0%,var(--color-brand),transparent_70%)]
                       opacity-60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full
                       bg-brand-purple/25 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your money deserves better than guesswork.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70">
              Start tracking smarter with SpendWise.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl
                           bg-white px-6 py-3.5 text-sm font-semibold text-brand-deep transition
                           hover:-translate-y-0.5 hover:bg-brand-soft focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border
                           border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition
                           hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-white sm:w-auto"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
