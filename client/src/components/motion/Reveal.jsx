import { useEffect, useRef, useState } from 'react';

/**
 * Fades and lifts its children into view the first time they are scrolled to.
 *
 * IntersectionObserver rather than a scroll listener: the browser does the
 * intersection maths off the main thread, so this costs nothing on a page with
 * thirty of them, where a scroll handler would fire hundreds of times a second.
 *
 * The observer disconnects after firing — the animation is an entrance, and
 * re-playing it every time the user scrolls back up is exactly the kind of
 * fidgeting that makes a page feel cheap.
 *
 * The actual motion lives in index.css (.reveal / .is-visible) so that
 * prefers-reduced-motion can switch it off in one place.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null);
  // Seeded during render rather than patched by the effect: with no
  // IntersectionObserver there is nothing to observe, so the honest initial
  // state is "visible" — and setting it from inside the effect would queue a
  // second render just to undo the hidden state we had no reason to set.
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    const element = ref.current;
    // Nothing to do when unsupported — the initial state already failed open.
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      // Fire slightly before the element is fully on screen, so the animation
      // is finishing as the reader's eye arrives rather than starting then.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
