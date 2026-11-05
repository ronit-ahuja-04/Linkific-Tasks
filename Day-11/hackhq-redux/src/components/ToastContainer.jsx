import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Button, IconButton, toneColors } from './ui.jsx';
import { dropToastAction, takeToastAction } from '../store/toastActions.js';
import { selectToasts, toastDismissed } from '../store/slices/toastsSlice.js';
import { animateToast } from '../styles/animations.js';

const TONES = {
  success: { icon: CheckCircle2, tone: 'good' },
  warning: { icon: AlertCircle, tone: 'warn' },
  error: { icon: AlertCircle, tone: 'bad' },
  info: { icon: Info, tone: 'accent' },
};

const Stack = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 1090;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(22rem, 100%);
  max-width: 100%;
`;
const ToastBox = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-left: 4px solid ${({ theme, $tone }) => toneColors(theme, $tone).fg};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow};
  ${animateToast}
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  > svg:first-child {
    flex-shrink: 0;
    color: ${({ theme, $tone }) => toneColors(theme, $tone).fg};
  }
`;
const Message = styled.span`
  flex: 1;
  min-width: 0;
  font-weight: 500;
`;
const Close = styled(IconButton)`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
`;
const Actions = styled.div`
  padding: 0 0.75rem 0.75rem;
`;

export default function ToastContainer() {
  // REDUX: toasts come from the store; dismissing dispatches toastDismissed
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);
  if (!toasts || toasts.length === 0) return null;

  return (
    <div role="region" aria-label="Notifications" aria-live="polite">
      <Stack>
        {toasts.map((toast) => {
          const { icon: Icon, tone } = TONES[toast.type] ?? TONES.info;

          return (
            <ToastBox key={toast.id} $tone={tone} role="status" aria-live="polite">
              <Head $tone={tone}>
                <Icon size={18} aria-hidden="true" />
                <Message>{toast.message}</Message>
                <Close
                  $variant="ghost"
                  onClick={() => {
                    dropToastAction(toast.id);
                    dispatch(toastDismissed(toast.id));
                  }}
                  aria-label="Dismiss notification"
                >
                  <X size={16} aria-hidden="true" />
                </Close>
              </Head>
              {toast.actionLabel && (
                <Actions>
                  <Button
                    $variant="secondary"
                    $size="sm"
                    onClick={() => {
                      const fn = takeToastAction(toast.id);
                      fn?.();
                      dispatch(toastDismissed(toast.id));
                    }}
                  >
                    {toast.actionLabel}
                  </Button>
                </Actions>
              )}
            </ToastBox>
          );
        })}
      </Stack>
    </div>
  );
}
