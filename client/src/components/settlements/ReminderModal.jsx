import { useEffect, useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { generateReminder } from '../../services/reminderService.js';
import { useClipboard } from '../../hooks/useClipboard.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Skeleton from '../ui/Skeleton.jsx';

const TONES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'firm', label: 'Firm' },
];

/**
 * Generate and copy a payment reminder (IDEA.md §16).
 *
 * The MVP deliberately stops at the clipboard: §16 says message generation and
 * copying is all that is needed, and §17's WhatsApp/SMS/email integrations are
 * explicitly not a first-version requirement. The API already routes through a
 * channel adapter, so adding one later does not change this component.
 */
export default function ReminderModal({ groupId, debt, onClose, onGenerated }) {
  const [tone, setTone] = useState('friendly');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { copy, status } = useClipboard();

  // Regenerate whenever the tone changes — the server owns the wording.
  useEffect(() => {
    if (!debt) return undefined;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    generateReminder(groupId, { fromMember: debt.from, toMember: debt.to, tone })
      .then((reminder) => {
        if (cancelled) return;
        setMessage(reminder.message);
        onGenerated?.();
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
    // onGenerated is intentionally omitted: it refetches history, and including
    // it would regenerate the reminder in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, debt, tone]);

  if (!debt) return null;

  return (
    <Modal isOpen onClose={onClose} title={`Remind ${debt.fromName}`}>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Tone</p>
          <div className="inline-flex rounded-lg border border-line p-0.5" role="group">
            {TONES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                aria-pressed={tone === option.value}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tone === option.value ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <Skeleton className="h-24" />}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
          >
            {error.message}
          </div>
        )}

        {message && !isLoading && (
          <>
            {/* Editable: the generated text is a starting point, and people
                want to add their own line before sending. */}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5
                           text-sm leading-relaxed text-ink focus:outline-2 focus:outline-offset-0
                           focus:outline-brand"
              />
            </label>

            <div className="flex gap-3">
              <Button onClick={() => copy(message)} className="flex-1">
                {status === 'copied' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy message
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>

            {status === 'failed' && (
              <p className="flex items-center gap-1.5 text-xs text-expense">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                Couldn&apos;t reach the clipboard — select the text above and copy it manually.
              </p>
            )}

            <p className="text-xs text-ink-muted">
              Paste it into WhatsApp, SMS or email. Sending directly from SpendWise is
              planned for a later version.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
