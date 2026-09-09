import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth, currentMonth, shiftMonth } from '../../utils/date.js';

/** Month stepper. Forward is disabled in the current month — there is nothing ahead. */
export default function MonthPicker({ month, onChange, className = '' }) {
  const isCurrent = month === currentMonth();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Step
        onClick={() => onChange(shiftMonth(month, -1))}
        label="Previous month"
        icon={ChevronLeft}
      />
      <span className="min-w-40 text-center text-sm font-medium text-ink">
        {formatMonth(month)}
      </span>
      <Step
        onClick={() => onChange(shiftMonth(month, 1))}
        label="Next month"
        icon={ChevronRight}
        disabled={isCurrent}
      />
    </div>
  );
}

function Step({ onClick, label, icon: Icon, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-muted
                 transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed
                 disabled:opacity-40"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
