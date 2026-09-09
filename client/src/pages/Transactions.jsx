import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { listTransactions } from '../services/transactionService.js';
import { listCategories } from '../services/categoryService.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';
import TransactionFilters from '../components/transactions/TransactionFilters.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const INITIAL_FILTERS = {
  search: '',
  type: '',
  categoryId: '',
  paymentMethod: '',
  sort: '-date',
  page: 1,
  limit: 20,
};

/** Full transaction history with search, filters, sorting and paging (§9). */
export default function Transactions() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    ...INITIAL_FILTERS,
    // Allows deep links like /transactions?type=expense from the mobile nav.
    type: searchParams.get('type') ?? '',
  });

  // Debounced so typing does not fire a request per keystroke.
  const search = useDebounce(filters.search, 300);

  const { data: categories } = useFetch(() => listCategories(), []);

  const query = { ...filters, search };
  const { data, error, isLoading, refetch } = useFetch(
    () => listTransactions(query),
    [search, filters.type, filters.categoryId, filters.paymentMethod, filters.sort, filters.page]
  );

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={meta ? `${meta.total} recorded` : undefined}
        action={
          <Link to="/transactions/new?type=expense" className="hidden sm:block">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add expense
            </Button>
          </Link>
        }
      />

      <TransactionFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      <Card className="p-4">
        <TransactionList
          transactions={data?.data}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle={
            filters.search || filters.type || filters.categoryId
              ? 'No matching transactions'
              : 'No transactions yet'
          }
          emptyDescription={
            filters.search || filters.type || filters.categoryId
              ? 'Try changing or clearing your filters.'
              : 'Add your first income or expense to start tracking.'
          }
          emptyAction={
            <Link to="/transactions/new?type=expense">
              <Button>Add an expense</Button>
            </Link>
          }
        />
      </Card>

      {meta && meta.totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
          <Button
            variant="secondary"
            disabled={meta.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  );
}
