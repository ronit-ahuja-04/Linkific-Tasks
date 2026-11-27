import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  /** Controls whether the dialog is mounted and visible. */
  open: boolean;
  /** Callback invoked on backdrop click, Escape key, or close button click. */
  onClose: () => void;
  /** Accessible dialog heading text. */
  title: string;
  /** Optional subtitle linked via aria-describedby. */
  description?: string;
  /** Max-width preset for the modal panel. */
  size?: ModalSize;
  /** Accessible aria-label for the top-right close button. */
  closeLabel?: string;
  /** Hides the default top-right close button when custom actions handle dismissal. */
  hideCloseButton?: boolean;
  /** Allows closing when clicking the backdrop outside the dialog panel. */
  closeOnBackdrop?: boolean;
  /** Optional extra classes for the modal card panel. */
  className?: string;
  children: ReactNode;
  /** Optional action bar rendered at the bottom of the dialog. */
  footer?: ReactNode;
}

const MODAL_SIZE_STYLES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  closeLabel = 'Close dialog',
  hideCloseButton = false,
  closeOnBackdrop = true,
  className = '',
  children,
  footer,
}: ModalProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) {
              onClose();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <m.div
            ref={panelRef}
            tabIndex={-1}
            initial={reduce ? false : { scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            className={`rpg-card relative w-full bg-surface p-6 focus:outline-none sm:p-8 ${MODAL_SIZE_STYLES[size]} ${className}`.trim()}
          >
            {!hideCloseButton && (
              <button
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <h2 id={titleId} className="pr-8 font-display text-2xl font-extrabold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}

            <div className="mt-4">{children}</div>

            {footer && (
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-4">
                {footer}
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
