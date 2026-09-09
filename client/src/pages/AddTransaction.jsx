import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import Card from '../components/ui/Card.jsx';

/**
 * Add income or an expense.
 *
 * IDEA.md §25 lists "Add Income" and "Add Expense" as separate pages, and they
 * are separate routes — but they render the same form with a different `type`,
 * because duplicating it would mean maintaining two copies of the same fields
 * (§32.13).
 */
export default function AddTransaction() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') === 'income' ? 'income' : 'expense';

  return (
    <>
      <PageHeader
        title={type === 'income' ? 'Add income' : 'Add expense'}
        subtitle={
          type === 'income'
            ? 'Record money you received.'
            : 'Record money you spent.'
        }
      />
      <Card className="p-5">
        <TransactionForm type={type} />
      </Card>
    </>
  );
}
