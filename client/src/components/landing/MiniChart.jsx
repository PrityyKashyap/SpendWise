import { useId } from 'react';

/**
 * Hand-rolled SVG charts for the landing page.
 *
 * Deliberately NOT Recharts, even though the app already depends on it. Recharts
 * is ~305KB and the real app loads it lazily, per route. The landing page is the
 * entry point for every first-time visitor, so pulling a charting library into
 * that bundle would trade the page's first impression — how fast it paints — for
 * charts that only ever draw fifteen hard-coded numbers. These are a few dozen
 * lines of SVG and add nothing measurable.
 *
 * All of these are decorative illustrations of demo data, so they are hidden
 * from assistive tech; the figures they depict are always stated in text
 * nearby, which is what a screen-reader user actually needs.
 */

/** Smooth-ish area chart. `values` are arbitrary units; only the shape matters. */
export function MiniArea({ values, className = '', stroke = 'var(--color-brand)' }) {
  // A document-unique id. Two MiniAreas with a hard-coded gradient id would
  // collide, and every instance after the first would silently paint itself
  // with the FIRST one's colours — which is exactly what happened when the
  // green savings chart rendered with a purple fill.
  // useId() wraps its value in punctuation (React has used both ':' and '«' at
  // different versions) and this id goes into url(#...), so strip it down to
  // characters that are unambiguously safe in a fragment reference.
  const gradientId = `sw-area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const width = 300;
  const height = 96;
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Pad the range so the line never touches the top or bottom edge.
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 10 - ((value - min) / span) * (height - 26);
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="draw-line"
        style={{ '--dash': 700 }}
      />
    </svg>
  );
}

/** Paired income/expense columns. */
export function MiniBars({ data, className = '' }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]));

  return (
    <div className={`flex items-end gap-3 sm:gap-5 ${className}`} aria-hidden="true">
      {data.map((d, index) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center gap-1">
            <span
              className="rise-bar w-1/3 rounded-t-md bg-income/80"
              style={{ height: `${(d.income / max) * 100}%`, animationDelay: `${index * 70}ms` }}
            />
            <span
              className="rise-bar w-1/3 rounded-t-md bg-brand"
              style={{ height: `${(d.expense / max) * 100}%`, animationDelay: `${index * 70 + 35}ms` }}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-muted">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Donut built from a single circle per slice, offset around the ring with
 * stroke-dasharray. Cheaper and crisper than generating arc paths.
 */
/**
 * Lay slices out around the ring, each offset by the total length of the ones
 * before it. Kept as a pure helper so the running total is a local inside a
 * function call, not a binding mutated while the component renders.
 */
function buildSlices(segments, circumference) {
  let consumed = 0;
  return segments.map((segment) => {
    const length = (segment.share / 100) * circumference;
    const slice = { ...segment, length, offset: consumed };
    consumed += length;
    return slice;
  });
}

export function MiniDonut({ segments, className = '' }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <g transform="rotate(-90 60 60)">
        {buildSlices(segments, circumference).map((slice) => (
          <circle
            key={slice.name}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="16"
            strokeDasharray={`${slice.length} ${circumference - slice.length}`}
            strokeDashoffset={-slice.offset}
          />
        ))}
      </g>
    </svg>
  );
}

/** A labelled spend-vs-limit bar. Amber past 75%, red past 100%. */
export function BudgetMeter({ name, spent, limit, format }) {
  const pct = Math.min(100, Math.round((spent / limit) * 100));
  const tone = pct >= 100 ? 'bg-expense' : pct >= 75 ? 'bg-i-owe' : 'bg-brand';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{name}</span>
        <span className="tabular text-sm text-ink-muted">
          {format(spent)} <span className="text-ink-muted/60">/ {format(limit)}</span>
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name} budget used`}
      >
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
