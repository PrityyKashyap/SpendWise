import { useId } from 'react';

/**
 * The SpendWise logo system.
 *
 * Construction: four shapes — a tilted flap peeking out behind the top-right,
 * the rounded body, a thick white card across the middle, and a clasp pill with
 * a solid dot breaking the right edge. The flap is drawn first so the body
 * overlaps its lower half, which is what makes it read as a flap tucked behind
 * rather than a bump stuck on.
 *
 * Earlier attempts drew the card as a ribbon bending up at the right; at any
 * size it read as a hook, not a wallet. A plain thick pill is what matches the
 * reference and what survives being shrunk to a favicon.
 *
 * The wordmark splits the two halves of the name across two colours, which is
 * what makes "SpendWise" read as one word rather than two.
 *
 * Variants (brief §2):
 *   <Logo />                      A. primary horizontal — mark + wordmark
 *   <Logo variant="icon" />       B. icon only
 *   <Logo tone="onDark" />        C. for dark / purple backgrounds
 *   <Logo tone="brand" />         D. for white / light backgrounds
 *   <Logo tone="mono" />          E. monochrome, inherits currentColor
 *   <Logo withTagline />          adds "Track Today. A Brighter Tomorrow."
 */

/*
 * One entry per tone. `solid` swaps the two gradients for a single flat colour,
 * which is what makes the monochrome variant a genuine one-colour mark rather
 * than a gradient with the saturation turned down.
 */
const TONES = {
  brand: {
    body: ['#8E7CFF', '#5533D6'],
    flap: ['#CFC7FF', '#8064F2'],
    detail: '#FFFFFF',
    word: 'text-ink',
    accent: 'text-brand',
    tagline: 'text-ink-muted',
  },
  onDark: {
    body: ['#FFFFFF', '#D6CEFF'],
    flap: ['#FFFFFF', '#EFEBFF'],
    detail: '#5533D6',
    word: 'text-white',
    accent: 'text-[#A99BFF]',
    tagline: 'text-white/60',
  },
  mono: {
    solid: true,
    detail: 'var(--color-surface)',
    word: 'text-current',
    accent: 'text-current',
    tagline: 'text-current opacity-70',
  },
};

export const TAGLINE = 'Track Today. A Brighter Tomorrow.';

/**
 * The bare wallet mark.
 *
 * `title` is what a screen reader announces. Passing title={null} marks it
 * decorative — correct when the wordmark sits beside it, where announcing
 * "SpendWise" twice is just noise.
 */
export function LogoMark({ tone = 'brand', className = 'h-8 w-8', title = 'SpendWise' }) {
  const config = TONES[tone] ?? TONES.brand;

  // Gradient ids must be unique per instance. With a hard-coded id, a second
  // <Logo> on the same page (navbar + footer) would silently repaint itself
  // using the first one's gradient.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bodyFill = config.solid ? 'currentColor' : `url(#sw-body-${uid})`;
  const flapFill = config.solid ? 'currentColor' : `url(#sw-flap-${uid})`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title && <title>{title}</title>}

      {!config.solid && (
        <defs>
          <linearGradient id={`sw-body-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor={config.body[0]} />
            <stop offset="1" stopColor={config.body[1]} />
          </linearGradient>
          <linearGradient id={`sw-flap-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={config.flap[0]} />
            <stop offset="1" stopColor={config.flap[1]} />
          </linearGradient>
        </defs>
      )}

      {/* Flap, tilted and drawn first so the body overlaps its lower half. */}
      <g transform="rotate(-7 32 32)">
        <rect x="27" y="7" width="31" height="25" rx="11" fill={flapFill} />
      </g>

      {/* Wallet body. */}
      <rect x="4.5" y="16" width="45" height="41" rx="15" fill={bodyFill} />

      {/* Card across the middle. */}
      <rect x="10" y="22.5" width="35" height="14" rx="7" fill={config.detail} />

      {/* Clasp: a pill breaking the right edge, with a solid dot. */}
      <rect
        x="34.5"
        y="36"
        width="22"
        height="15.5"
        rx="7.75"
        fill={flapFill}
        stroke={config.detail}
        strokeWidth="2.8"
      />
      <circle cx="45.5" cy="43.75" r="3.5" fill={config.detail} />
    </svg>
  );
}

/** Mark plus wordmark — the default, and what belongs in a navbar or footer. */
export default function Logo({
  variant = 'full',
  tone = 'brand',
  withTagline = false,
  className = '',
  markClassName = 'h-8 w-8',
  wordClassName = 'text-lg',
}) {
  const config = TONES[tone] ?? TONES.brand;

  if (variant === 'icon') {
    return <LogoMark tone={tone} className={`${markClassName} ${className}`} />;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Decorative: the wordmark beside it already says "SpendWise". */}
      <LogoMark tone={tone} className={`shrink-0 ${markClassName}`} title={null} />

      <span className="flex flex-col">
        <span className={`font-bold leading-none tracking-tight ${wordClassName}`}>
          <span className={config.word}>Spend</span>
          <span className={config.accent}>Wise</span>
        </span>
        {withTagline && (
          <span className={`mt-1.5 text-xs font-medium ${config.tagline}`}>{TAGLINE}</span>
        )}
      </span>
    </span>
  );
}
