import { Link } from 'react-router-dom';
import Logo from '../brand/Logo.jsx';

const PRODUCT = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/groups', label: 'Groups' },
  { to: '/reports', label: 'Reports' },
];

/*
 * The brief asks for these four, but none of them exist yet. They are rendered
 * as plainly unavailable rather than as links, because a footer link that lands
 * on a 404 — or worse, a Privacy page with invented promises in it — is more
 * damaging than an honest "Soon".
 */
const COMPANY = ['About', 'Contact', 'Privacy', 'Terms'];

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface px-5 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo markClassName="h-8 w-8" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Track spending, manage budgets, and split expenses — without the spreadsheet.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Product</h2>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="rounded text-sm text-ink-muted transition hover:text-brand
                               focus-visible:outline-2 focus-visible:outline-offset-2
                               focus-visible:outline-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY.map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="text-sm text-ink-muted/70">{label}</span>
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-xs text-ink-muted">
            © 2026 SpendWise. Built for smarter everyday finances.
          </p>
        </div>
      </div>
    </footer>
  );
}
