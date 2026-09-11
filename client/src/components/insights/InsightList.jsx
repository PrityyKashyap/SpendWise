import { Lightbulb, TrendingDown, TrendingUp, PiggyBank, Info } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';

const STYLES = {
  warning: { icon: TrendingUp, tint: 'text-i-owe', bg: 'bg-i-owe/10' },
  positive: { icon: TrendingDown, tint: 'text-income', bg: 'bg-income/10' },
  suggestion: { icon: PiggyBank, tint: 'text-brand', bg: 'bg-brand-soft' },
  neutral: { icon: Info, tint: 'text-ink-muted', bg: 'bg-canvas' },
};

/**
 * Spending insights (IDEA.md §21).
 *
 * Every figure here is computed from the user's own transactions — no language
 * model is involved, so nothing can be stated about their money that the data
 * does not support. §21 also warns against posing as a financial adviser,
 * hence the closing note.
 */
export default function InsightList({ data, isLoading }) {
  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;

  // Nothing worth saying is better than filler that trains people to ignore
  // the panel.
  if (!data?.insights?.length) return null;

  return (
    <Card className="anim-rise p-5" style={{ animationDelay: '280ms' }}>
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 animate-pulse text-brand" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink">What changed this month</h2>
      </div>

      <ul className="stagger-in space-y-2.5">
        {data.insights.map((insight) => {
          const style = STYLES[insight.type] ?? STYLES.neutral;
          const Icon = style.icon;

          return (
            <li key={insight.id} className="flex items-start gap-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${style.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${style.tint}`} aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-ink">{insight.text}</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
        Worked out from your own transactions. This is a summary of your spending, not
        financial advice.
      </p>
    </Card>
  );
}
