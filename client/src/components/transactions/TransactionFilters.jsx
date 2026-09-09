import { Search, X } from 'lucide-react';
import { PAYMENT_METHODS } from '@spendwise/shared/constants.js';

/**
 * Filter controls for the transaction list (IDEA.md §9).
 *
 * Controlled by the parent so the active filters can also drive the URL and
 * the fetch, keeping one source of truth.
 */
export default function TransactionFilters({ filters, categories, onChange, onReset }) {
  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value, page: 1 });

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.categoryId || filters.paymentMethod || filters.from
  );

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={filters.search ?? ''}
          onChange={set('search')}
          placeholder="Search descriptions…"
          aria-label="Search transactions"
          className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm
                     text-ink transition placeholder:text-ink-muted
                     focus:outline-2 focus:outline-offset-0 focus:outline-brand"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect value={filters.type ?? ''} onChange={set('type')} label="All types">
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </FilterSelect>

        <FilterSelect
          value={filters.categoryId ?? ''}
          onChange={set('categoryId')}
          label="All categories"
        >
          {(categories ?? []).map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.paymentMethod ?? ''}
          onChange={set('paymentMethod')}
          label="Any method"
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={filters.sort ?? '-date'} onChange={set('sort')}>
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-amount">Largest first</option>
          <option value="amount">Smallest first</option>
        </FilterSelect>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5
                       text-xs font-medium text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, label, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      aria-label={label}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium
                 text-ink transition focus:outline-2 focus:outline-offset-0 focus:outline-brand"
    >
      {label && <option value="">{label}</option>}
      {children}
    </select>
  );
}
