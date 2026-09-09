import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { getTransaction, deleteTransaction } from '../services/transactionService.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../components/ui/Skeleton.jsx';

export default function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: transaction, error, isLoading, refetch } = useFetch(
    () => getTransaction(id),
    [id]
  );

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
      navigate('/transactions', { replace: true });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <SkeletonRows count={5} className="h-16" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title={`Edit ${transaction.type}`}
        subtitle={transaction.description}
      />

      <Card className="p-5">
        <TransactionForm type={transaction.type} existing={transaction} />
      </Card>

      <div className="mt-4">
        {confirmDelete ? (
          // Deleting a financial record is not undoable, so it takes two steps
          // rather than firing on a single tap.
          <div className="rounded-lg border border-expense/20 bg-expense/5 p-4">
            <p className="text-sm font-medium text-ink">Delete this transaction?</p>
            <p className="mt-1 text-sm text-ink-muted">This cannot be undone.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-expense px-4 py-2.5 text-sm font-medium text-white
                           transition hover:opacity-90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-expense
                       transition hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete transaction
          </button>
        )}
      </div>
    </>
  );
}
