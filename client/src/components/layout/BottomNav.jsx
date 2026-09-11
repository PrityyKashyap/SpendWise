import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, ChartPie, Plus, MoreHorizontal,
  Target, Users, Handshake, FileText, User, LogOut,
} from 'lucide-react';

/**
 * Mobile navigation (IDEA.md §27).
 *
 * Four primary destinations around a central add button, because adding an
 * expense is what people do on a phone, standing in a shop.
 *
 * The previous version spent two of its five slots on the same screen —
 * "Activity" and "Spending" both opened the transaction list — and gave a
 * whole primary slot to Log out, which is the least frequent action in the
 * app. Everything secondary now lives behind More, which frees the bar for
 * the screens people actually move between.
 */
const PRIMARY = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/transactions', label: 'Activity', icon: ArrowLeftRight },
];

const PRIMARY_RIGHT = [{ to: '/analytics', label: 'Insights', icon: ChartPie }];

const SECONDARY = [
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/settlements', label: 'Settle up', icon: Handshake },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav({ onLogout }) {
  const navigate = useNavigate();
  // One sheet at a time: 'add', 'more', or none.
  const [sheet, setSheet] = useState(null);

  // Any panel covering the page needs a keyboard way out, not just a tap target.
  useEffect(() => {
    if (!sheet) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setSheet(null);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sheet]);

  const go = (to) => {
    setSheet(null);
    navigate(to);
  };

  return (
    <>
      {sheet && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSheet(null)}
            className="fixed inset-0 z-40 bg-brand-deep/25 backdrop-blur-[2px] lg:hidden"
          />
          <div
            role="dialog"
            aria-label={sheet === 'add' ? 'Add a transaction' : 'More destinations'}
            className="anim-rise fixed inset-x-3 bottom-24 z-50 overflow-hidden rounded-2xl
                       border border-line/80 bg-surface/90 p-2 shadow-xl shadow-brand-deep/15
                       backdrop-blur-2xl lg:hidden"
          >
            {sheet === 'add' ? (
              <>
                <SheetItem icon={Plus} label="Add expense" tone="text-expense"
                  onClick={() => go('/transactions/new?type=expense')} />
                <SheetItem icon={Plus} label="Add income" tone="text-income"
                  onClick={() => go('/transactions/new?type=income')} />
              </>
            ) : (
              <>
                {SECONDARY.map((item) => (
                  <SheetItem key={item.to} icon={item.icon} label={item.label}
                    onClick={() => go(item.to)} />
                ))}
                <div className="my-1 border-t border-line" />
                <SheetItem icon={LogOut} label="Log out" tone="text-expense"
                  onClick={() => { setSheet(null); onLogout(); }} />
              </>
            )}
          </div>
        </>
      )}

      {/* Translucent rather than solid: content scrolling beneath stays faintly
          visible, which is what stops a fixed bar reading as a dead slab. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t
                   border-line/70 bg-surface/85 backdrop-blur-2xl
                   pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY.map((item) => <Tab key={item.to} {...item} />)}

        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={() => setSheet((s) => (s === 'add' ? null : 'add'))}
            aria-label="Add a transaction"
            aria-expanded={sheet === 'add'}
            className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-brand text-white
                       shadow-lg shadow-brand/30 transition duration-200 active:scale-95
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Plus
              className={`h-5 w-5 transition-transform duration-200 ${
                sheet === 'add' ? 'rotate-45' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {PRIMARY_RIGHT.map((item) => <Tab key={item.to} {...item} />)}

        <button
          type="button"
          onClick={() => setSheet((s) => (s === 'more' ? null : 'more'))}
          aria-label="More"
          aria-expanded={sheet === 'more'}
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2
                      transition ${sheet === 'more' ? 'text-brand' : 'text-ink-muted'}`}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}

function Tab({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2
         transition ${isActive ? 'text-brand' : 'text-ink-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          {/* A small bar rather than a filled pill: enough to locate yourself,
              not enough to compete with the content above it. */}
          <span
            aria-hidden="true"
            className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${
              isActive ? 'bg-brand opacity-100' : 'opacity-0'
            }`}
          />
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SheetItem({ icon: Icon, label, tone = 'text-ink', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm
                  font-medium transition hover:bg-canvas active:scale-[0.99] ${tone}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}
