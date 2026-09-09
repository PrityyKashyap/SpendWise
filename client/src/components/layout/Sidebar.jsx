import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Users, ChartPie, FileText, Handshake, Target } from 'lucide-react';

/** Routes that exist today. Later phases add Groups, Analytics, Budgets. */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', icon: ChartPie },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/settlements', label: 'Settle up', icon: Handshake },
];

/** Desktop navigation. Hidden below lg, where BottomNav takes over. */
export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-surface lg:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <div className="px-2 py-3">
          <span className="text-base font-semibold tracking-tight text-ink">SpendWise</span>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, phase }) =>
            phase ? (
              // Not yet built. Shown greyed rather than hidden so the shape of
              // the product is visible, and clearly not clickable so it cannot
              // be mistaken for something that works (IDEA.md §32.7).
              <span
                key={to}
                title={`Arrives in Phase ${phase}`}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2
                           text-sm text-ink-muted/50"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-soft text-brand'
                      : 'text-ink-muted hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
