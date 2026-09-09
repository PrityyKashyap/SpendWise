/**
 * A surface with a border.
 *
 * IDEA.md §26: cards only where they improve hierarchy. Lists of rows should
 * be plain dividers, not forty nested cards.
 */
export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm shadow-slate-900/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
