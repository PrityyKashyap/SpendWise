import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { createGroupSchema } from '@spendwise/shared/validators/group.js';
import { useFetch } from '../hooks/useFetch.js';
import { useForm } from '../hooks/useForm.js';
import { listGroups, createGroup } from '../services/groupService.js';
import { formatMoney } from '../utils/money.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import MemberInput from '../components/groups/MemberInput.jsx';
import MemberAvatar from '../components/groups/MemberAvatar.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../components/ui/Skeleton.jsx';

export default function Groups() {
  const [isCreating, setIsCreating] = useState(false);
  const [members, setMembers] = useState([]);
  const { data: groups, error, isLoading, refetch } = useFetch(() => listGroups(), []);

  const form = useForm({
    initialValues: { name: '', description: '' },
    transform: (values) => ({
      name: values.name,
      description: values.description,
      // Blank emails are stripped: an empty string is not a valid email, and a
      // ghost member legitimately has none.
      members: members.map((m) => ({ name: m.name, ...(m.email ? { email: m.email } : {}) })),
    }),
    schema: createGroupSchema,
    onSubmit: async (payload) => {
      await createGroup(payload);
      setIsCreating(false);
      setMembers([]);
      form.values.name = '';
      refetch();
    },
  });

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="Shared expenses with friends, flatmates or a trip."
        action={
          !isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New group
            </Button>
          )
        }
      />

      {isCreating && (
        <Card className="mb-4 p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Create a group</h2>
          <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
            {form.errors._form && (
              <div
                role="alert"
                className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
              >
                {form.errors._form}
              </div>
            )}
            <Input
              label="Group name"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              error={form.errors.name}
              placeholder="Goa Trip 2026"
              maxLength={60}
              autoFocus
            />
            <Input
              label="Description (optional)"
              name="description"
              value={form.values.description}
              onChange={form.handleChange}
              error={form.errors.description}
              placeholder="Beach trip with the usual crew"
              maxLength={200}
            />
            <MemberInput members={members} onChange={setMembers} error={form.errors.members} />
            <div className="flex gap-3">
              <Button type="submit" isLoading={form.isSubmitting}>
                Create group
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  setMembers([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && <SkeletonRows count={3} className="h-24" />}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {groups && !isLoading && (
        groups.length === 0 && !isCreating ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create one for a trip, a flat, or anything you split with other people."
              action={<Button onClick={() => setIsCreating(true)}>Create a group</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link key={group._id} to={`/groups/${group._id}`} className="block">
                <Card className="p-4 transition hover:border-brand/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{group.name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {group.memberCount} member{group.memberCount === 1 ? '' : 's'} ·{' '}
                        {group.expenseCount} expense{group.expenseCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-sm font-semibold text-ink">
                        {formatMoney(group.totalSpent)}
                      </p>
                      <p className="text-xs text-ink-muted">total spent</p>
                    </div>
                  </div>

                  <div className="mt-3 flex -space-x-1.5">
                    {group.members.slice(0, 6).map((member) => (
                      <span key={member._id} className="ring-2 ring-white rounded-full">
                        <MemberAvatar member={member} size="sm" />
                      </span>
                    ))}
                    {group.members.length > 6 && (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-canvas text-[11px] font-medium text-ink-muted ring-2 ring-white">
                        +{group.members.length - 6}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}
    </>
  );
}
