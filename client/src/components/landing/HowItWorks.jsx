import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';

const STEPS = [
  { number: '01', title: 'Track', body: 'Add your income and expenses.' },
  { number: '02', title: 'Analyze', body: 'Understand your spending patterns.' },
  { number: '03', title: 'Plan', body: 'Set budgets and savings goals.' },
  { number: '04', title: 'Improve', body: 'Make smarter financial decisions.' },
];

export default function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Four steps, and the picture clears up."
      subtitle="No import wizards, no bank linking, no setup weekend."
    >
      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* The connecting line. Decorative, and only on the wide layout where
            the steps actually sit in a row. */}
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r
                     from-transparent via-brand/25 to-transparent lg:block"
        />

        {STEPS.map((step, index) => (
          <Reveal as="li" key={step.number} delay={index * 100} className="relative">
            <span
              className="relative z-10 grid h-12 w-12 place-items-center rounded-xl border
                         border-brand/20 bg-surface text-sm font-semibold text-brand
                         shadow-sm shadow-brand-deep/5"
            >
              {step.number}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
