import { Gauge, Lock, Sparkles, Wallet } from 'lucide-react';
import Reveal from '../motion/Reveal.jsx';

/**
 * Four plain statements of what the product does and how it behaves.
 *
 * Deliberately no user counts, partner logos, awards or testimonials: SpendWise
 * has none, and inventing them would be a lie printed on the homepage. Claims
 * about the software's own design are things we can actually stand behind.
 */
const ITEMS = [
  { icon: Wallet, title: 'Smart tracking', body: 'Every rupee in and out, categorised as you go.' },
  { icon: Lock, title: 'Secure by design', body: 'Hashed passwords and short-lived sessions by default.' },
  { icon: Gauge, title: 'Real-time insights', body: 'Balances and budgets update the moment you add anything.' },
  { icon: Sparkles, title: 'Built for everyday spending', body: 'Groceries, rent, trips and the group dinner bill.' },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-line bg-surface px-5 py-12 sm:px-6">
      <ul className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }, index) => (
          <Reveal as="li" key={title} delay={index * 70} className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">{body}</span>
            </span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
