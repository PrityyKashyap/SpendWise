import { useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js';

/**
 * Tips its children toward the pointer.
 *
 * The handler writes two CSS custom properties and nothing else — no React
 * state, so moving the mouse across a card does not re-render the subtree
 * underneath it sixty times a second. The transform that reads those properties
 * lives in index.css and stays on the compositor.
 */
export default function Tilt({ max = 6, className = '', children, ...props }) {
  const ref = useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  function handleMove(event) {
    const element = ref.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    // -0.5 … 0.5 from the centre of the card.
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    element.classList.add('tilt-active');
    // Y tilts with horizontal travel, X against vertical — that inversion is
    // what makes it feel like the card is leaning toward the cursor.
    element.style.setProperty('--tilt-y', `${(x * max).toFixed(2)}deg`);
    element.style.setProperty('--tilt-x', `${(-y * max).toFixed(2)}deg`);
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    // Drop the fast transition so it eases back rather than snapping.
    element.classList.remove('tilt-active');
    element.style.setProperty('--tilt-y', '0deg');
    element.style.setProperty('--tilt-x', '0deg');
  }

  if (prefersReduced) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
