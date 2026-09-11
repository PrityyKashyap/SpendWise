import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Handshake } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import CountUpMoney from '../motion/CountUp.jsx';

/**
 * Outstanding debts in both directions (IDEA.md §8).
 *
 * These figures are deliberately NOT filtered by the selected month: a debt
 * from August is still owed in September, and hiding it when the month rolls
 * over would make real money silently disappear from the dashboard.
 */
export default function DebtSummary({ summary, isLoading }) {
  if (isLoading) return <Skeleton className="h-24 rounded-2xl" />;
  if (!summary) return null;

  const { othersOweMe, iOweOthers } = summary;

  if (othersOweMe === 0 && iOweOthers === 0) {
    return (
      <Card className="anim-rise flex items-center gap-3 p-4" style={{ animationDelay: '210ms' }}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-income/10">
          <Handshake className="h-4 w-4 text-income" aria-hidden="true" />
        </span>
        <p className="text-sm text-ink-muted">
          You&apos;re all square — no outstanding balances with anyone.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <DebtCard
        icon={ArrowDownLeft}
        label="Others owe me"
        value={othersOweMe}
        tone="text-owed"
        ring="bg-owed/10"
        border="hover:border-owed/40"
        delay="210ms"
      />
      <DebtCard
        icon={ArrowUpRight}
        label="I owe others"
        value={iOweOthers}
        tone="text-i-owe"
        ring="bg-i-owe/10"
        border="hover:border-i-owe/40"
        delay="280ms"
      />
    </div>
  );
}

function DebtCard({ icon: Icon, label, value, tone, ring, border, delay }) {
  return (
    <Link to="/settlements" className="group block">
      <Card
        className={`hover-lift anim-rise h-full p-4 hover:shadow-lg hover:shadow-brand-deep/10 ${border}`}
        style={{ animationDelay: delay }}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full transition-transform
                        duration-300 group-hover:scale-110 ${ring}`}
          >
            <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden="true" />
          </span>
          {label}
        </div>
        <p className={`mt-2 text-xl font-semibold ${tone}`}>
          <CountUpMoney value={value} duration={900} />
        </p>
      </Card>
    </Link>
  );
}
