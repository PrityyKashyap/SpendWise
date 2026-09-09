import { Bell } from 'lucide-react';
import { formatMoney } from '../../utils/money.js';
import { formatRelativeDay } from '../../utils/date.js';

/**
 * Reminders already generated (IDEA.md §16).
 *
 * The point is answering "have I already asked?" before nudging someone twice
 * in a week, so the most recent ask is what leads.
 */
export default function ReminderHistory({ reminders }) {
  if (!reminders?.length) return null;

  return (
    <ul className="divide-y divide-line">
      {reminders.slice(0, 10).map((reminder) => (
        <li key={reminder._id} className="flex items-start gap-3 py-2.5">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-canvas">
            <Bell className="h-3 w-3 text-ink-muted" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              Reminded <span className="font-medium">{reminder.fromName}</span> about{' '}
              <span className="tabular font-medium">{formatMoney(reminder.amount)}</span>
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {formatRelativeDay(reminder.createdAt)} · {reminder.tone}
              {reminder.channel === 'copy' && ' · copied'}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
