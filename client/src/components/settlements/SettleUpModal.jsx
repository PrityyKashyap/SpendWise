import { useState } from 'react';
import { formatMoney, toPaise, fromPaise } from '../../utils/money.js';
import { createSettlement } from '../../services/settlementService.js';
import { todayInput } from '../../utils/date.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import AmountInput from '../ui/AmountInput.jsx';

const METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

/**
 * Record that a debt was paid (IDEA.md §14).
 *
 * The amount is prefilled with the full debt but stays editable, which is all
 * a partial payment needs: balances are derived from settlement records, so
 * paying ₹1,200 of ₹2,000 simply leaves ₹800 outstanding — no separate
 * "partial" state exists or is needed (ARCHITECTURE.md §6.6).
 */
export default function SettleUpModal({ groupId, debt, onClose, onSettled }) {
  const [amount, setAmount] = useState(debt ? String(fromPaise(debt.amount)) : '');
  const [method, setMethod] = useState('upi');
  const [settledAt, setSettledAt] = useState(todayInput());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!debt) return null;

  const paise = amount === '' ? 0 : toPaise(amount);
  const isPartial = paise > 0 && paise < debt.amount;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await createSettlement(groupId, {
        fromMember: debt.from,
        toMember: debt.to,
        amount: paise,
        method,
        settledAt,
      });
      onSettled();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Record a payment">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{debt.fromName}</span> pays{' '}
          <span className="font-medium text-ink">{debt.toName}</span>
          <span className="tabular block text-lg font-semibold text-ink">
            {formatMoney(debt.amount)} outstanding
          </span>
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
          >
            {error.fields?.amount ?? error.message}
          </div>
        )}

        <AmountInput
          label="Amount paid"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        {isPartial && (
          <p className="text-xs text-ink-muted">
            Partial payment — {formatMoney(debt.amount - paise)} will remain outstanding.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="How"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            options={METHODS}
          />
          <Input
            label="When"
            type="date"
            value={settledAt}
            onChange={(event) => setSettledAt(event.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" isLoading={isSaving} disabled={paise <= 0} className="flex-1">
            Record payment
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
