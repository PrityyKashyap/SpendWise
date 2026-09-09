import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../hooks/useAuth.js';
import { listGroups } from '../services/groupService.js';
import { getBalances } from '../services/settlementService.js';
import { formatMoney } from '../utils/money.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import BalanceList from '../components/settlements/BalanceList.jsx';
import SettleUpModal from '../components/settlements/SettleUpModal.jsx';
import SimplifyToggle from '../components/settlements/SimplifyToggle.jsx';
import ReminderModal from '../components/settlements/ReminderModal.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../components/ui/Skeleton.jsx';

/**
 * Every outstanding balance, across all groups (IDEA.md §13).
 *
 * The group page answers "who owes whom in Goa"; this answers "who owes me
 * anything, anywhere" — which is the question you actually have when deciding
 * whom to chase.
 */
export default function Settlements() {
  const { data: groups, error, isLoading, refetch } = useFetch(() => listGroups(), []);

  if (isLoading) return <SkeletonRows count={3} className="h-32" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader title="Settle up" subtitle="Outstanding balances across all your groups." />

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create a group and shared balances will appear here."
            action={
              <Link to="/groups">
                <Button>Go to groups</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupBalances key={group._id} group={group} />
          ))}
        </div>
      )}
    </>
  );
}

function GroupBalances({ group }) {
  const { user } = useAuth();
  const [isSimplified, setIsSimplified] = useState(false);
  const [settling, setSettling] = useState(null);
  const [reminding, setReminding] = useState(null);

  const { data, error, isLoading, refetch } = useFetch(
    () => getBalances(group._id, { simplify: true }),
    [group._id]
  );

  const myMember = group.members.find((m) => String(m.userId) === String(user?._id));

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link to={`/groups/${group._id}`} className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink hover:underline">{group.name}</h2>
        </Link>
        {data?.myBalance && data.myBalance.net !== 0 && (
          <span
            className={`tabular shrink-0 text-sm font-semibold ${
              data.myBalance.net > 0 ? 'text-owed' : 'text-i-owe'
            }`}
          >
            {data.myBalance.net > 0 ? '+' : ''}
            {formatMoney(data.myBalance.net)}
          </span>
        )}
      </div>

      {isLoading && <SkeletonRows count={2} className="h-12" />}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {data && (
        <>
          {data.pairwise.length > 0 && (
            <SimplifyToggle
              isSimplified={isSimplified}
              onChange={setIsSimplified}
              pairwiseCount={data.pairwise.length}
              simplifiedCount={data.simplified?.length}
            />
          )}
          <BalanceList
            debts={isSimplified ? data.simplified ?? [] : data.pairwise}
            currentMemberId={myMember?._id}
            onSettle={setSettling}
            onRemind={setReminding}
          />
        </>
      )}

      {settling && (
        <SettleUpModal
          groupId={group._id}
          debt={settling}
          onClose={() => setSettling(null)}
          onSettled={refetch}
        />
      )}

      {reminding && (
        <ReminderModal
          groupId={group._id}
          debt={reminding}
          onClose={() => setReminding(null)}
        />
      )}
    </Card>
  );
}
