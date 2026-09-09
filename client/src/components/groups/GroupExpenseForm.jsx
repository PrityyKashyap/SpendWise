import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroupExpenseSchema } from '@spendwise/shared/validators/groupExpense.js';
import { useForm } from '../../hooks/useForm.js';
import { createGroupExpense, previewSplit } from '../../services/groupService.js';
import { toPaise, formatMoney } from '../../utils/money.js';
import { todayInput } from '../../utils/date.js';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import AmountInput from '../ui/AmountInput.jsx';
import MemberList from './MemberList.jsx';
import MemberAvatar from './MemberAvatar.jsx';
import SplitTypeSelector from '../splits/SplitTypeSelector.jsx';
import SplitValueInputs from '../splits/SplitValueInputs.jsx';
import SplitSummary from '../splits/SplitSummary.jsx';

/**
 * Add a group expense (IDEA.md §11).
 *
 * Mobile-first single-page form rather than the multi-step wizard sketched in
 * ARCHITECTURE.md §4.2: with only an equal split there are five fields, and a
 * four-step wizard around five fields is friction, not guidance. The wizard
 * earns its place in Phase 6 when exact/percentage/shares add real per-person
 * input — revisit it there.
 */
export default function GroupExpenseForm({ group }) {
  const navigate = useNavigate();

  const currentMember = useMemo(
    () => group.members.find((m) => m.userId) ?? group.members[0],
    [group.members]
  );

  const [paidBy, setPaidBy] = useState(currentMember?._id ?? '');
  const [splitType, setSplitType] = useState('equal');
  // Everyone is included by default — the common case for a shared bill.
  const [participantIds, setParticipantIds] = useState(group.members.map((m) => m._id));
  const [preview, setPreview] = useState(null);

  /**
   * Per-person input for non-equal splits, keyed by member id and held as
   * strings — the raw contents of each input. They are converted to numbers
   * only when the payload is built, so a half-typed "33." does not become NaN
   * mid-keystroke.
   */
  const [splitValues, setSplitValues] = useState({});

  /**
   * Convert one person's raw input into the `value` the API expects.
   *
   * The unit depends on the split type: exact amounts are entered in rupees
   * and sent as paise; percentages and share counts are sent as typed.
   */
  const toApiValue = useCallback(
    (memberId) => {
      const raw = splitValues[memberId];
      if (raw === undefined || raw === '') return undefined;
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return undefined;
      return splitType === 'exact' ? toPaise(numeric) : numeric;
    },
    [splitValues, splitType]
  );

  // useCallback so this is a stable dependency of the preview effect. Without
  // it the function is a new object each render, and listing it as a dep would
  // re-run the effect on every keystroke rather than only when the split
  // actually changes.
  const buildParticipants = useCallback(
    () =>
      participantIds.map((memberId) => {
        if (splitType === 'equal') return { memberId };
        const value = toApiValue(memberId);
        return { memberId, ...(value === undefined ? {} : { value }) };
      }),
    [participantIds, splitType, toApiValue]
  );

  const form = useForm({
    initialValues: { description: '', amount: '', date: todayInput(), notes: '' },
    transform: (values) => ({
      description: values.description,
      totalAmount: values.amount === '' ? Number.NaN : toPaise(values.amount),
      paidBy,
      splitType,
      participants: buildParticipants(),
      date: values.date,
      ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
    }),
    schema: createGroupExpenseSchema,
    onSubmit: async (payload) => {
      await createGroupExpense(group._id, payload);
      navigate(`/groups/${group._id}`, { replace: true });
    },
  });

  const totalPaise = form.values.amount === '' ? 0 : toPaise(form.values.amount || 0);

  /**
   * Ask the server to resolve the split as the user types.
   *
   * Deliberately not recomputed on the client: doing the maths twice means two
   * implementations of the rounding rule that can disagree, and the preview
   * would then show amounts that differ from what gets saved.
   */
  // Gate on validity rather than clearing state inside the effect: a
  // synchronous setState in an effect triggers an extra render pass, and
  // hiding the preview is a render-time decision, not a state change.
  // A non-equal split cannot be previewed until every participant has a value —
  // asking the server to resolve an incomplete split would only produce a
  // validation error the user has not finished causing yet.
  const hasAllValues =
    splitType === 'equal' ||
    participantIds.every((id) => toApiValue(id) !== undefined);

  const canPreview =
    totalPaise > 0 && participantIds.length > 0 && Boolean(paidBy) && hasAllValues;

  useEffect(() => {
    if (!canPreview) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await previewSplit(group._id, {
          description: form.values.description || 'preview',
          totalAmount: totalPaise,
          paidBy,
          splitType,
          participants: buildParticipants(),
          date: form.values.date,
        });
        if (!cancelled) setPreview({ participants: result.participants, error: null });
      } catch (err) {
        // A split that does not add up is expected while typing, so the
        // server's message is shown inline rather than swallowed — that
        // message is the whole point of the live preview.
        if (!cancelled) setPreview({ participants: null, error: err });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    canPreview,
    group._id,
    totalPaise,
    paidBy,
    splitType,
    buildParticipants,
    form.values.description,
    form.values.date,
  ]);

  const nameOf = (memberId) =>
    group.members.find((m) => String(m._id) === String(memberId))?.name ?? '—';

  const resolved = preview?.participants ?? null;
  const allocated = resolved?.reduce((sum, p) => sum + p.share, 0) ?? 0;

  function toggleParticipant(memberId) {
    setParticipantIds((current) =>
      current.some((id) => String(id) === String(memberId))
        ? current.filter((id) => String(id) !== String(memberId))
        : [...current, memberId]
    );
  }

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6" noValidate>
      {form.errors._form && (
        <div
          role="alert"
          className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
        >
          {form.errors._form}
        </div>
      )}

      <AmountInput
        name="amount"
        label="Total amount"
        value={form.values.amount}
        onChange={form.handleChange}
        error={form.errors.totalAmount}
        autoFocus
      />

      <Input
        label="What was it for?"
        name="description"
        value={form.values.description}
        onChange={form.handleChange}
        error={form.errors.description}
        placeholder="Hotel"
        maxLength={140}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Paid by</p>
        <MemberList
          members={group.members}
          variant="single"
          selected={paidBy}
          onSelect={setPaidBy}
        />
        {form.errors.paidBy && <p className="mt-1.5 text-sm text-expense">{form.errors.paidBy}</p>}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Split between</p>
          <button
            type="button"
            onClick={() =>
              setParticipantIds(
                participantIds.length === group.members.length
                  ? []
                  : group.members.map((m) => m._id)
              )
            }
            className="text-xs font-medium text-brand hover:underline"
          >
            {participantIds.length === group.members.length ? 'Clear all' : 'Select everyone'}
          </button>
        </div>
        <MemberList
          members={group.members}
          variant="multi"
          selected={participantIds}
          onSelect={toggleParticipant}
        />
        {form.errors.participants && (
          <p className="mt-1.5 text-sm text-expense">{form.errors.participants}</p>
        )}
      </div>

      <SplitTypeSelector
        value={splitType}
        onChange={(next) => {
          setSplitType(next);
          // Values from a previous type are meaningless under the new one —
          // "40" as a percentage is not "40" as a share count.
          setSplitValues({});
        }}
      />

      {splitType !== 'equal' && (
        <SplitValueInputs
          splitType={splitType}
          members={group.members}
          participantIds={participantIds}
          values={splitValues}
          onChange={setSplitValues}
          totalPaise={totalPaise}
          error={form.errors.participants}
        />
      )}

      {/* The server's rejection message, shown live rather than on submit. */}
      {preview?.error && (
        <SplitSummary
          allocated={0}
          total={totalPaise}
          isValid={false}
          message={preview.error.fields?.participants ?? preview.error.message}
        />
      )}

      {canPreview && resolved && (
        <div className="space-y-2">
          <SplitSummary allocated={allocated} total={totalPaise} isValid={allocated === totalPaise} />
          <ul className="divide-y divide-line rounded-lg border border-line px-3">
            {resolved.map((participant) => (
              <li key={participant.memberId} className="flex items-center gap-2.5 py-2.5">
                <MemberAvatar member={{ _id: participant.memberId, name: nameOf(participant.memberId) }} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {nameOf(participant.memberId)}
                </span>
                <span className="tabular text-sm font-medium text-ink">
                  {formatMoney(participant.share)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Input
        label="Date"
        name="date"
        type="date"
        value={form.values.date}
        onChange={form.handleChange}
        error={form.errors.date}
      />

      <div className="flex gap-3">
        <Button type="submit" isLoading={form.isSubmitting} className="flex-1">
          Add expense
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
