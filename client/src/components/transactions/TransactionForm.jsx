import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransactionSchema } from '@spendwise/shared/validators/transaction.js';
import { PAYMENT_METHODS } from '@spendwise/shared/constants.js';
import { useForm } from '../../hooks/useForm.js';
import { useFetch } from '../../hooks/useFetch.js';
import { listCategories } from '../../services/categoryService.js';
import { createTransaction, updateTransaction } from '../../services/transactionService.js';
import { toPaise } from '../../utils/money.js';
import { todayInput, toDateInput } from '../../utils/date.js';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import AmountInput from '../ui/AmountInput.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';

/**
 * One form for both income and expenses (IDEA.md §32.13).
 *
 * The two differ only in which categories are offered and the accent colour,
 * so a second component would be the same fields duplicated — and would drift.
 */
export default function TransactionForm({ type, existing }) {
  const navigate = useNavigate();
  const isEditing = Boolean(existing);

  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesLoading,
    refetch,
  } = useFetch(() => listCategories({ type }), [type]);

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c._id, label: c.name })),
    [categories]
  );

  const form = useForm({
    initialValues: {
      amount: existing ? String(existing.amount / 100) : '',
      categoryId: existing?.category?._id ?? '',
      description: existing?.description ?? '',
      paymentMethod: existing?.paymentMethod ?? 'upi',
      date: existing ? toDateInput(existing.date) : todayInput(),
      notes: existing?.notes ?? '',
    },

    // Rupees in the input become integer paise in the payload, and the shared
    // schema then validates exactly what the API will receive.
    transform: (values) => ({
      type,
      amount: values.amount === '' ? Number.NaN : toPaise(values.amount),
      categoryId: values.categoryId,
      description: values.description,
      paymentMethod: values.paymentMethod,
      date: values.date,
      ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
    }),

    schema: createTransactionSchema,

    onSubmit: async (payload) => {
      if (isEditing) await updateTransaction(existing._id, payload);
      else await createTransaction(payload);
      navigate('/transactions', { replace: true });
    },
  });

  // The category list must load before the form is usable — submitting without
  // a category can only fail.
  if (categoriesLoading) return <SkeletonRows count={5} className="h-16" />;
  if (categoriesError) return <ErrorState error={categoriesError} onRetry={refetch} />;

  return (
    <form onSubmit={form.handleSubmit} className="space-y-5" noValidate>
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
        label={type === 'income' ? 'Amount received' : 'Amount spent'}
        value={form.values.amount}
        onChange={form.handleChange}
        error={form.errors.amount}
        autoFocus
      />

      <Input
        label="Description"
        name="description"
        value={form.values.description}
        onChange={form.handleChange}
        error={form.errors.description}
        placeholder={type === 'income' ? 'September salary' : 'Dinner with friends'}
        maxLength={140}
      />

      <Select
        label={type === 'income' ? 'Source' : 'Category'}
        name="categoryId"
        value={form.values.categoryId}
        onChange={form.handleChange}
        error={form.errors.categoryId}
        options={[{ value: '', label: 'Choose…' }, ...categoryOptions]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Payment method"
          name="paymentMethod"
          value={form.values.paymentMethod}
          onChange={form.handleChange}
          error={form.errors.paymentMethod}
          options={PAYMENT_METHODS}
        />
        <Input
          label="Date"
          name="date"
          type="date"
          value={form.values.date}
          onChange={form.handleChange}
          error={form.errors.date}
        />
      </div>

      <Input
        label="Notes (optional)"
        name="notes"
        value={form.values.notes}
        onChange={form.handleChange}
        error={form.errors.notes}
        placeholder="Anything worth remembering"
        maxLength={500}
      />

      <div className="flex gap-3 pt-1">
        <Button type="submit" isLoading={form.isSubmitting} className="flex-1">
          {isEditing ? 'Save changes' : `Add ${type}`}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
