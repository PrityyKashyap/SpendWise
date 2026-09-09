import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import TransactionList from '../transactions/TransactionList.jsx';

export default function RecentTransactions({ transactions, isLoading, error, onRetry }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
        {transactions?.length > 0 && (
          <Link to="/transactions" className="text-xs font-medium text-brand hover:underline">
            View all
          </Link>
        )}
      </div>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyTitle="Nothing recorded yet"
        emptyDescription="Your income and expenses will show up here."
        emptyAction={
          <Link to="/transactions/new?type=expense">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add an expense
            </Button>
          </Link>
        }
      />
    </Card>
  );
}
