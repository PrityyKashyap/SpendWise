/**
 * Shown when a request succeeds but there is nothing to display.
 *
 * Always names the next action: a blank panel tells the user nothing about
 * whether the app is broken or simply new (ARCHITECTURE.md §4.5).
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-canvas">
          <Icon className="h-5 w-5 text-ink-muted" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
