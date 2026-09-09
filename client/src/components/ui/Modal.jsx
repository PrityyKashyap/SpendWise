import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog.
 *
 * Uses the native <dialog> element so focus trapping, Escape-to-close and
 * inertness of the page behind come from the browser rather than being
 * reimplemented — reimplemented focus traps are where keyboard accessibility
 * usually breaks.
 */
export default function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clicking the backdrop closes; clicking the panel must not bubble to it.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-surface
                 p-0 text-ink backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted transition hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
