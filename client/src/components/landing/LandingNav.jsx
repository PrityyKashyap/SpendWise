import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../brand/Logo.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#split', label: 'Split expenses' },
  { href: '#pricing', label: 'Pricing' },
];

/**
 * The public site header.
 *
 * Sticky with a backdrop blur, and it grows a border and shadow only once the
 * page has scrolled — so the hero reads as one uninterrupted surface at rest,
 * and the bar separates itself from the content the moment it starts to overlap.
 */
export default function LandingNav() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    // Passive: this listener never calls preventDefault, and saying so lets the
    // browser keep scrolling on the compositor instead of waiting for us.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape closes the mobile menu. Any panel that traps the page behind it
  // needs a keyboard way out, not just a tap target.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'border-b border-line/80 bg-surface/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl'
          : 'border-b border-transparent bg-surface/0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link to="/" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <Logo markClassName="h-8 w-8" />
          <span className="sr-only">SpendWise home</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition
                         hover:bg-brand-soft hover:text-brand
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition
                         hover:bg-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-brand"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink transition
                           hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-brand sm:block"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white
                           shadow-sm shadow-brand/25 transition hover:bg-brand-purple
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Get Started
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="landing-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-canvas
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel. Rendered only when open so its links stay out of the tab
          order while it is hidden. */}
      {isMenuOpen && (
        <div
          id="landing-menu"
          className="border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Main" className="mx-auto max-w-6xl px-5 py-3 sm:px-6">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-ink transition
                           hover:bg-brand-soft hover:text-brand"
              >
                {link.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-ink transition
                           hover:bg-brand-soft hover:text-brand sm:hidden"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
