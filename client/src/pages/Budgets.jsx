import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { createBudgetSchema } from '@spendwise/shared/validators/budget.js';
import { useFetch } from '../hooks/useFetch.js';
import { useForm } from '../hooks/useForm.js';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService.js';
import { listCategories } from '../services/categoryService.js';
import { toPaise, formatMoney, fromPaise } from '../utils/money.js';
import { currentMonth } from '../utils/date.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import MonthPicker from '../components/analytics/MonthPicker.jsx';
import BudgetBar from '../components/budgets/BudgetBar.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Select from '../components/ui/Select.jsx';
import AmountInput from '../components/ui/AmountInput.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

/** Monthly spending limits per category (IDEA.md §20). */
export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const budgets = useFetch(() => getBudgets(month), [month]);
  const { data: categories } = useFetch(() => listCategories({ type: 'expense' }), []);

  const data = budgets.data;

  // Categories that already have a budget are not offered again — the API
  // rejects duplicates, so showing them would only produce an error.
  const budgeted = new Set((data?.budgets ?? []).map((b) => String(b.category._id)));
  const available = (categories ?? []).filter((c) => !budgeted.has(String(c._id)));

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Monthly limits, so you know before you overspend."
        action={
          <div className="flex items-center gap-2">
            <MonthPicker month={month} onChange={setMonth} />
            <Button onClick={() => setIsCreating(true)} disabled={available.length === 0}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New budget</span>
            </Button>
          </div>
        }
      />

      {budgets.isLoading && <Skeleton className="h-64" />}
      {budgets.error && <ErrorState error={budgets.error} onRetry={budgets.refetch} />}

      {data && !budgets.isLoading && (
        data.budgets.length === 0 ? (
          <Card>
            <EmptyState
              icon={Target}
              title="No budgets yet"
              description="Set a monthly limit for a category and SpendWise will warn you as you approach it."
              action={
                <Button onClick={() => setIsCreating(true)} disabled={available.length === 0}>
                  Set your first budget
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-ink-muted">Total budgeted</p>
                <p className="tabular text-sm text-ink-muted">
                  <span className="text-lg font-semibold text-ink">
                    {formatMoney(data.totals.spent)}
                  </span>{' '}
                  of {formatMoney(data.totals.limit)}
                </p>
              </div>
              {data.isPartialMonth && (
                <p className="mt-1 text-xs text-ink-muted">
                  This month is still in progress.
                </p>
              )}
            </Card>

            <Card className="divide-y divide-line px-5">
              {data.budgets.map((budget) => (
                <BudgetBar key={budget._id} budget={budget} onEdit={setEditing} />
              ))}
            </Card>
          </div>
        )
      )}

      {isCreating && (
        <BudgetModal
          categories={available}
          onClose={() => setIsCreating(false)}
          onSaved={() => {
            setIsCreating(false);
            budgets.refetch();
          }}
        />
      )}

      {editing && (
        <BudgetModal
          budget={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            budgets.refetch();
          }}
        />
      )}
    </>
  );
}

function BudgetModal({ budget, categories, onClose, onSaved }) {
  const isEditing = Boolean(budget);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    initialValues: {
      categoryId: budget ? String(budget.category._id) : '',
      amount: budget ? String(fromPaise(budget.amount)) : '',
    },
    transform: (values) => ({
      categoryId: values.categoryId,
      amount: values.amount === '' ? Number.NaN : toPaise(values.amount),
      warnAtPercent: budget?.warnAtPercent ?? 80,
    }),
    // Editing sends only the amount, so the create schema does not apply.
    schema: isEditing ? undefined : createBudgetSchema,
    onSubmit: async (payload) => {
      if (isEditing) await updateBudget(budget._id, { amount: payload.amount });
      else await createBudget(payload);
      onSaved();
    },
  });

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteBudget(budget._id);
      onSaved();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? `Edit ${budget.category.name} budget` : 'New budget'}>
      <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
        {form.errors._form && (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
          >
            {form.errors._form}
          </div>
        )}

        {!isEditing && (
          <Select
            label="Category"
            name="categoryId"
            value={form.values.categoryId}
            onChange={form.handleChange}
            error={form.errors.categoryId}
            options={[
              { value: '', label: 'Choose…' },
              ...categories.map((c) => ({ value: c._id, label: c.name })),
            ]}
          />
        )}

        <AmountInput
          label="Monthly limit"
          name="amount"
          value={form.values.amount}
          onChange={form.handleChange}
          error={form.errors.amount}
          autoFocus
        />

        <div className="flex gap-3">
          <Button type="submit" isLoading={form.isSubmitting} className="flex-1">
            {isEditing ? 'Save' : 'Set budget'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm font-medium text-expense transition hover:underline disabled:opacity-50"
          >
            {isDeleting ? 'Removing…' : 'Remove this budget'}
          </button>
        )}
      </form>
    </Modal>
  );
}
