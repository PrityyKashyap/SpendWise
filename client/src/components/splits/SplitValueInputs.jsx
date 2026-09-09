import { Minus, Plus, Wand } from 'lucide-react';
import { formatMoney, fromPaise } from '../../utils/money.js';
import MemberAvatar from '../groups/MemberAvatar.jsx';

/**
 * Per-person inputs for the non-equal split types.
 *
 * ARCHITECTURE.md §1.3 sketched SplitExact, SplitPercentage and SplitShares as
 * three components, but they differ only in unit, step and the shape of the
 * control — three files would be the same list copied three times, drifting
 * apart on the next change. One component with a `splitType` branch keeps the
 * layout, keyboard behaviour and accessibility identical across all three.
 */
const CONFIG = {
  exact: { label: 'Amounts', unit: '₹', step: '0.01', help: 'Must add up to the total' },
  percentage: { label: 'Percentages', unit: '%', step: '0.01', help: 'Must add up to 100%' },
  shares: { label: 'Shares', unit: '×', step: '1', help: 'Whole numbers, at least 1 each' },
};

export default function SplitValueInputs({
  splitType,
  members,
  participantIds,
  values,
  onChange,
  totalPaise,
  error,
}) {
  const config = CONFIG[splitType];
  if (!config) return null;

  const participants = members.filter((m) =>
    participantIds.some((id) => String(id) === String(m._id))
  );

  const set = (memberId, raw) => onChange({ ...values, [memberId]: raw });

  /**
   * Fill in an even split as a starting point.
   *
   * For exact amounts the last person absorbs the remainder, so the values
   * still add up to the total exactly rather than leaving the user a paisa
   * short for no visible reason.
   */
  function fillEvenly() {
    const count = participants.length;
    if (count === 0) return;

    const next = {};
    if (splitType === 'shares') {
      participants.forEach((m) => {
        next[m._id] = '1';
      });
    } else if (splitType === 'percentage') {
      const base = Math.floor((10000 / count)) / 100;
      let remaining = 10000 - Math.round(base * 100) * count;
      participants.forEach((m, i) => {
        next[m._id] = String(base + (i < remaining ? 0.01 : 0));
      });
    } else {
      const base = Math.floor(totalPaise / count);
      let remaining = totalPaise - base * count;
      participants.forEach((m, i) => {
        next[m._id] = String(fromPaise(base + (i < remaining ? 1 : 0)));
      });
    }
    onChange(next);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{config.label}</p>
        <button
          type="button"
          onClick={fillEvenly}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Wand className="h-3 w-3" aria-hidden="true" />
          Fill evenly
        </button>
      </div>
      <p className="mb-2 text-xs text-ink-muted">{config.help}</p>

      <ul className="divide-y divide-line rounded-lg border border-line">
        {participants.map((member) => (
          <li key={member._id} className="flex items-center gap-2.5 px-3 py-2.5">
            <MemberAvatar member={member} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{member.name}</span>

            {splitType === 'shares' ? (
              <Stepper
                value={values[member._id] ?? ''}
                onChange={(next) => set(member._id, next)}
                name={member.name}
              />
            ) : (
              <div className="relative w-28">
                <span
                  className="pointer-events-none absolute inset-y-0 left-2.5 grid place-items-center
                             text-sm text-ink-muted"
                  aria-hidden="true"
                >
                  {config.unit}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={config.step}
                  min="0"
                  value={values[member._id] ?? ''}
                  onChange={(event) => set(member._id, event.target.value)}
                  aria-label={`${config.label} for ${member.name}`}
                  placeholder="0"
                  className="tabular w-full rounded-lg border border-line bg-surface py-1.5 pl-6 pr-2
                             text-right text-sm text-ink focus:outline-2 focus:outline-offset-0
                             focus:outline-brand"
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* For percentages, showing the resulting rupee amount as they type is
          what makes a percentage split understandable at all. */}
      {splitType === 'percentage' && totalPaise > 0 && (
        <ul className="mt-2 space-y-0.5">
          {participants.map((member) => {
            const percent = Number(values[member._id] ?? 0);
            if (!percent) return null;
            return (
              <li key={member._id} className="flex justify-between text-xs text-ink-muted">
                <span>{member.name}</span>
                <span className="tabular">
                  ≈ {formatMoney(Math.round((totalPaise * Math.round(percent * 100)) / 10000))}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-1.5 text-sm text-expense">{error}</p>}
    </div>
  );
}

function Stepper({ value, onChange, name }) {
  const current = Number(value) || 0;

  return (
    <div className="flex items-center gap-1">
      <StepButton
        onClick={() => onChange(String(Math.max(1, current - 1)))}
        disabled={current <= 1}
        label={`Fewer shares for ${name}`}
        icon={Minus}
      />
      <input
        type="number"
        min="1"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Shares for ${name}`}
        className="tabular w-12 rounded-lg border border-line bg-surface py-1.5 text-center text-sm
                   text-ink focus:outline-2 focus:outline-offset-0 focus:outline-brand"
      />
      <StepButton
        onClick={() => onChange(String(current + 1))}
        label={`More shares for ${name}`}
        icon={Plus}
      />
    </div>
  );
}

function StepButton({ onClick, disabled, label, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-muted
                 transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed
                 disabled:opacity-40"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
