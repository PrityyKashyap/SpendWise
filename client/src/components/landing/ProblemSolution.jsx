import { ArrowDown, PieChart, Target, Users } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';
import Section from './Section.jsx';

const PROBLEMS = ['Where did my money go?', 'Am I overspending?', 'Who owes whom?'];

const SOLUTIONS = [
  {
    icon: PieChart,
    title: 'Automatic insights',
    body: 'Spending grouped by category the moment it lands, so the answer is already on screen.',
  },
  {
    icon: Target,
    title: 'Smart budgets',
    body: 'Set a limit per category and see how much room is left before you spend, not after.',
  },
  {
    icon: Users,
    title: 'Easy expense splitting',
    body: 'Shared bills divided exactly, down to the last paisa, with who-owes-whom worked out.',
  },
];

export default function ProblemSolution() {
  return (
    <Section
      eyebrow="The problem"
      title="Your money shouldn't be this complicated."
      subtitle="Three questions almost everyone asks at the end of the month — and almost nobody can answer from memory."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PROBLEMS.map((problem, index) => (
          <Reveal key={problem} delay={index * 90}>
            <div
              className="h-full rounded-2xl border border-dashed border-line bg-canvas p-6
                         text-center"
            >
              <p className="text-lg font-medium italic text-ink-muted">“{problem}”</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 flex flex-col items-center text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
          <ArrowDown className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          SpendWise turns financial chaos into clarity.
        </h3>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {SOLUTIONS.map(({ icon: Icon, title, body }, index) => (
          <Reveal key={title} delay={index * 90}>
            <div
              className="group h-full rounded-2xl border border-line bg-surface p-6 transition
                         duration-300 hover:-translate-y-1 hover:border-brand/25
                         hover:shadow-xl hover:shadow-brand-deep/10"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white
                           transition-transform duration-300 group-hover:scale-105"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h4 className="mt-5 text-base font-semibold text-ink">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
