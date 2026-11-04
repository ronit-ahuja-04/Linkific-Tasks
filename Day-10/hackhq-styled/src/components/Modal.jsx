import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fade = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const pop = keyframes`from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; }`;

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 100;
  display: grid; place-items: center; padding: 16px;
  background: ${({ theme }) => theme.colors.overlay};
  animation: ${fade} .15s ease-out;
`;

const Dialog = styled.div`
  width: min(460px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ theme }) => theme.space(6)};
  animation: ${pop} .2s ease-out;
`;

const Actions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; margin-top: ${({ theme }) => theme.space(5)};
`;

export function Modal({ open, title, onClose, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <Overlay onClick={onClose}>
      <Dialog role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <Actions>{actions}</Actions>
      </Dialog>
    </Overlay>
  );
}
