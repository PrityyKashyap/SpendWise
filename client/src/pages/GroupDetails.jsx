import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../hooks/useAuth.js';
import { getGroup, listGroupExpenses, addMember, removeMember } from '../services/groupService.js';
import { getBalances, listSettlements } from '../services/settlementService.js';
import { listReminders } from '../services/reminderService.js';
import { formatMoney } from '../utils/money.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import MemberList from '../components/groups/MemberList.jsx';
import GroupExpenseList from '../components/groups/GroupExpenseList.jsx';
import BalanceList from '../components/settlements/BalanceList.jsx';
import SimplifyToggle from '../components/settlements/SimplifyToggle.jsx';
import SettleUpModal from '../components/settlements/SettleUpModal.jsx';
import SettlementHistory from '../components/settlements/SettlementHistory.jsx';
import ReminderModal from '../components/settlements/ReminderModal.jsx';
import ReminderHistory from '../components/settlements/ReminderHistory.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

const TABS = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'members', label: 'Members' },
];

export default function GroupDetails() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('expenses');

  const group = useFetch(() => getGroup(groupId), [groupId]);
  const expenses = useFetch(() => listGroupExpenses(groupId), [groupId]);

  if (group.isLoading) return <Skeleton className="h-64" />;
  if (group.error) return <ErrorState error={group.error} onRetry={group.refetch} />;

  const data = group.data;
  const myMember = data.members.find((m) => String(m.userId) === String(user?._id));
  const isAdmin = myMember?.role === 'admin';

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={
          data.description ||
          `${data.members.length} members · ${formatMoney(data.totalSpent)} spent in total`
        }
        action={
          <Link to={`/groups/${groupId}/expenses/new`}>
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add expense
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
            {item.id === 'expenses' && data.expenseCount > 0 && (
              <span className="ml-1.5 text-xs text-ink-muted">{data.expenseCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <Card className="p-4">
          <GroupExpenseList
            expenses={expenses.data?.data}
            isLoading={expenses.isLoading}
            error={expenses.error}
            onRetry={expenses.refetch}
            currentMemberId={myMember?._id}
            emptyAction={
              <Link to={`/groups/${groupId}/expenses/new`}>
                <Button>Add an expense</Button>
              </Link>
            }
          />
        </Card>
      )}

      {tab === 'balances' && (
        <BalancesTab groupId={groupId} myMemberId={myMember?._id} />
      )}

      {tab === 'members' && (
        <MembersTab
          group={data}
          isAdmin={isAdmin}
          currentUserId={user?._id}
          onChanged={group.refetch}
        />
      )}
    </>
  );
}

function MembersTab({ group, isAdmin, currentUserId, onChanged }) {
  const [draft, setDraft] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleAdd(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      await addMember(group._id, {
        name: draft.name.trim(),
        ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
      });
      setDraft({ name: '', email: '' });
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(member) {
    setError(null);
    try {
      await removeMember(group._id, member._id);
      onChanged();
    } catch (err) {
      // Most often MEMBER_HAS_EXPENSES — a refusal that needs explaining, not
      // a silent failure.
      setError(err);
    }
  }

  return (
    <Card className="p-4">
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
        >
          {error.message}
        </div>
      )}

      <MemberList
        members={group.members}
        currentUserId={currentUserId}
        onRemove={isAdmin ? handleRemove : undefined}
      />

      {isAdmin && (
        <form onSubmit={handleAdd} className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium text-ink">Add someone</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              label=""
              aria-label="Name"
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              label=""
              aria-label="Email (optional)"
              type="email"
              placeholder="Email (optional)"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <Button type="submit" variant="secondary" isLoading={isSaving} disabled={!draft.name.trim()}>
              Add
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            A name is enough — they don&apos;t need an account.
          </p>
        </form>
      )}
    </Card>
  );
}

/**
 * Who owes whom, plus settling up (IDEA.md §13–15).
 *
 * Balances are refetched after every settlement rather than patched locally:
 * they are derived server-side from the expense ledger (decision D4), so
 * asking again is the only way to be certain the numbers are right.
 */
function BalancesTab({ groupId, myMemberId }) {
  const [isSimplified, setIsSimplified] = useState(false);
  const [settling, setSettling] = useState(null);
  const [reminding, setReminding] = useState(null);

  const balances = useFetch(() => getBalances(groupId, { simplify: true }), [groupId]);
  const settlements = useFetch(() => listSettlements(groupId), [groupId]);
  const reminders = useFetch(() => listReminders(groupId), [groupId]);

  function refreshAll() {
    balances.refetch();
    settlements.refetch();
  }

  if (balances.isLoading) return <Skeleton className="h-64" />;
  if (balances.error) return <ErrorState error={balances.error} onRetry={balances.refetch} />;

  const data = balances.data;
  const debts = isSimplified ? data.simplified ?? [] : data.pairwise;

  return (
    <>
      {/* Invariant I2 surfaced. If balances ever fail to sum to zero, money has
          been invented or lost, and showing the figures anyway would be worse
          than admitting the problem. */}
      {data.checksum !== 0 && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
        >
          These balances do not add up to zero, so they cannot be trusted. Please report this.
        </div>
      )}

      <Card className="mb-4 p-4">
        <SimplifyToggle
          isSimplified={isSimplified}
          onChange={setIsSimplified}
          pairwiseCount={data.pairwise.length}
          simplifiedCount={data.simplified?.length}
        />
        <BalanceList
          debts={debts}
          currentMemberId={myMemberId}
          onSettle={setSettling}
          onRemind={setReminding}
        />
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-ink">Payment history</h3>
        <SettlementHistory
          groupId={groupId}
          settlements={settlements.data}
          onChanged={refreshAll}
        />
      </Card>

      {reminders.data?.length > 0 && (
        <Card className="mt-4 p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Reminders sent</h3>
          <ReminderHistory reminders={reminders.data} />
        </Card>
      )}

      {settling && (
        <SettleUpModal
          groupId={groupId}
          debt={settling}
          onClose={() => setSettling(null)}
          onSettled={refreshAll}
        />
      )}

      {reminding && (
        <ReminderModal
          groupId={groupId}
          debt={reminding}
          onClose={() => setReminding(null)}
          onGenerated={reminders.refetch}
        />
      )}
    </>
  );
}
