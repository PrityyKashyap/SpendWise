/** Choose how to divide an expense (IDEA.md §12). */
const OPTIONS = [
  { value: 'equal', label: 'Equally', hint: 'Same amount each' },
  { value: 'exact', label: 'Exact amounts', hint: 'You set each amount' },
  { value: 'percentage', label: 'Percentages', hint: 'Must total 100%' },
  { value: 'shares', label: 'Shares', hint: 'e.g. 2 shares vs 1' },
];

export default function SplitTypeSelector({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">Split</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                isSelected ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-canvas'
              }`}
            >
              <span
                className={`block text-sm font-medium ${isSelected ? 'text-brand' : 'text-ink'}`}
              >
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
