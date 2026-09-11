import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import TransactionList from '../transactions/TransactionList.jsx';

export default function RecentTransactions({ transactions, isLoading, error, onRetry }) {
  return (
    <Card className="anim-rise p-5" style={{ animationDelay: '420ms' }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
        {transactions?.length > 0 && (
          <Link
            to="/transactions"
            className="group inline-flex items-center gap-1 text-xs font-medium text-brand
                       hover:underline"
          >
            View all
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>

      {/* stagger-in animates whatever rows TransactionList renders, by position.
          Doing it in CSS means the shared list component stays untouched and
          every other screen that uses it is unaffected. */}
      <div className="stagger-in">
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
      </div>
    </Card>
  );
}
