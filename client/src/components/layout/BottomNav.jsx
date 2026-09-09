import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Plus, User } from 'lucide-react';
import { useState } from 'react';

/**
 * Mobile navigation (IDEA.md §27).
 *
 * A thumb-reachable bar with the primary action in the middle, because adding
 * an expense is what people do on a phone, standing in a shop.
 */
export default function BottomNav({ onLogout }) {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      {isSheetOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
          />
          <div
            className="fixed inset-x-3 bottom-20 z-50 space-y-2 rounded-2xl border border-line
                       bg-surface p-2 shadow-lg lg:hidden"
          >
            <SheetButton
              onClick={() => {
                setIsSheetOpen(false);
                navigate('/transactions/new?type=expense');
              }}
              label="Add expense"
              tone="text-expense"
            />
            <SheetButton
              onClick={() => {
                setIsSheetOpen(false);
                navigate('/transactions/new?type=income');
              }}
              label="Add income"
              tone="text-income"
            />
          </div>
        </>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t
                   border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <Tab to="/dashboard" icon={LayoutDashboard} label="Home" />
        <Tab to="/transactions" icon={ArrowLeftRight} label="Activity" />

        <button
          type="button"
          onClick={() => setIsSheetOpen((open) => !open)}
          aria-label="Add a transaction"
          aria-expanded={isSheetOpen}
          className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-brand text-white
                     shadow-lg shadow-brand/25 transition active:scale-95"
        >
          <Plus className={`h-5 w-5 transition ${isSheetOpen ? 'rotate-45' : ''}`} />
        </button>

        <Tab to="/transactions?type=expense" icon={ArrowLeftRight} label="Spending" />
        <button
          type="button"
          onClick={onLogout}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-ink-muted"
        >
          <User className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium">Log out</span>
        </button>
      </nav>
    </>
  );
}

function Tab({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2.5 transition ${
          isActive ? 'text-brand' : 'text-ink-muted'
        }`
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

function SheetButton({ onClick, label, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium
                  transition hover:bg-canvas ${tone}`}
    >
      {label}
    </button>
  );
}
