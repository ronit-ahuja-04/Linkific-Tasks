import { useEffect, useId, useRef } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Backdrop, Dialog, IconButton } from './ui.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal behaviour: Escape closes, Tab is trapped inside `ref`, body scroll is locked, and
 * focus returns to whatever had it before opening. Used by ContentModal, CommandPalette and NavDrawer.
 */
export function useModalBehavior(ref, onClose, active = true) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return undefined;
    const previous = document.activeElement;
    const node = ref.current;
    if (node && !node.contains(document.activeElement)) {
      (node.querySelector('[autofocus], [data-autofocus]') ?? node).focus?.({
        preventScroll: true,
      });
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current?.();
      } else if (event.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus?.({ preventScroll: true });
    };
  }, [active, ref]);
}

const WIDTHS = { sm: '20rem', lg: '50rem', xl: '70rem' };

const Panel = styled(Dialog)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
`;
const Body = styled.div`
  padding: 1rem;
  overflow-y: auto;
  min-height: 0;
`;
const Foot = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;

/**
 * CONCEPT: One Modal, dynamic content - the caller keeps "what to show" in state (a product, a user)
 * and passes it in as children, so a single component serves every quick view.
 * Plain React handles the backdrop click, focus trap, Escape key and aria attributes.
 */
export default function ContentModal({ show, onHide, title, footer, size, children }) {
  if (!show) return null;
  return (
    <ModalInner onHide={onHide} title={title} footer={footer} size={size}>
      {children}
    </ModalInner>
  );
}

function ModalInner({ onHide, title, footer, size, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useModalBehavior(ref, onHide);

  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onHide?.();
      }}
    >
      <Panel
        ref={ref}
        $padded={false}
        $width={WIDTHS[size] ?? '31.25rem'}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <Head>
          <h2 id={titleId}>{title}</h2>
          <IconButton $variant="ghost" onClick={onHide} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </IconButton>
        </Head>
        <Body>{children}</Body>
        {footer && <Foot>{footer}</Foot>}
      </Panel>
    </Backdrop>
  );
}
