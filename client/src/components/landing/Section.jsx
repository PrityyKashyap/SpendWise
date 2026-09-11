import Reveal from '../motion/Reveal.jsx';

/**
 * The shell every landing section shares: width, rhythm, and heading block.
 *
 * Centralised because consistent spacing and type scale is most of what
 * separates a designed page from a stack of divs — and because changing the
 * rhythm later should be one edit, not eleven.
 */
export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
  children,
}) {
  const centred = align === 'center';

  return (
    <section id={id} className={`px-5 py-20 sm:px-6 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title) && (
          <Reveal className={`max-w-2xl ${centred ? 'mx-auto text-center' : ''}`}>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink-muted">
                {subtitle}
              </p>
            )}
          </Reveal>
        )}

        <div className={eyebrow || title ? 'mt-14' : ''}>{children}</div>
      </div>
    </section>
  );
}
