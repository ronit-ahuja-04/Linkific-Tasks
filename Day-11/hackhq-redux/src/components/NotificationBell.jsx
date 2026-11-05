import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, CheckCheck, Info, Trash2, TriangleAlert, CircleX } from 'lucide-react';
import styled from 'styled-components';
import { IconButton, Button, toneColors } from './ui.jsx';
import { formatPostDate } from '../lib/announcements.js';
import {
  allNotificationsRead,
  notificationRead,
  notificationsCleared,
  selectNotifications,
  selectUnreadNotificationCount,
} from '../store/slices/notificationsSlice.js';

const Wrap = styled.div`
  position: relative;
`;
const Trigger = styled(IconButton)`
  position: relative;
`;
const Count = styled.span`
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
`;
const Panel = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 1040;
  width: min(23rem, calc(100vw - 1.5rem));
  max-height: min(28rem, 70vh);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow};
  overflow: hidden;
`;
const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  h2 {
    margin: 0;
    font-size: 1rem;
  }
`;
const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
`;
const Row = styled.li`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme, $unread }) => ($unread ? theme.colors.accentSoft : 'transparent')};
  &:last-child {
    border-bottom: 0;
  }
  > svg {
    flex-shrink: 0;
    margin-top: 0.15rem;
    color: ${({ theme, $tone }) => toneColors(theme, $tone).fg};
  }
`;
const Body = styled.div`
  flex: 1;
  min-width: 0;
  p {
    margin: 0;
    overflow-wrap: anywhere;
    font-weight: ${({ $unread }) => ($unread ? 600 : 400)};
  }
  small {
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const Empty = styled.p`
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
`;
const Foot = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;

const ICONS = { success: [Check, 'good'], warn: [TriangleAlert, 'warn'], error: [CircleX, 'bad'] };

/** Header bell with a history of every toast, unread count, mark read and clear */
export default function NotificationBell() {
  // REDUX: the list and the unread count are two selectors on the same slice; the count is
  // memoized with createSelector so it only recomputes when the list changes
  const items = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadNotificationCount);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close on Escape or on a click outside the panel
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <Wrap ref={rootRef}>
      <Trigger
        $variant="secondary"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && <Count aria-hidden="true">{unread > 9 ? '9+' : unread}</Count>}
      </Trigger>

      {open && (
        <Panel role="dialog" aria-label="Notifications">
          <PanelHead>
            <h2>Notifications</h2>
            <Button
              $variant="ghost"
              $size="sm"
              onClick={() => dispatch(allNotificationsRead())}
              disabled={unread === 0}
            >
              <CheckCheck size={15} aria-hidden="true" />
              Mark all read
            </Button>
          </PanelHead>
          {items.length === 0 ? (
            <Empty>No notifications yet. Things you do in HackHQ will show up here.</Empty>
          ) : (
            <Items>
              {items.map((n) => {
                const [Icon, tone] = ICONS[n.type] ?? [Info, 'accent'];
                return (
                  <Row key={n.id} $unread={!n.read} $tone={tone}>
                    <Icon size={16} aria-hidden="true" />
                    <Body $unread={!n.read}>
                      <p>{n.message}</p>
                      <small>
                        {formatPostDate(n.createdAt)}
                        {!n.read && ' · unread'}
                      </small>
                    </Body>
                    {!n.read && (
                      <Button
                        $variant="ghost"
                        $size="sm"
                        onClick={() => dispatch(notificationRead(n.id))}
                        aria-label={`Mark "${n.message}" as read`}
                      >
                        <Check size={15} aria-hidden="true" />
                      </Button>
                    )}
                  </Row>
                );
              })}
            </Items>
          )}
          {items.length > 0 && (
            <Foot>
              <Button $variant="ghost" $size="sm" onClick={() => dispatch(notificationsCleared())}>
                <Trash2 size={15} aria-hidden="true" />
                Clear all
              </Button>
            </Foot>
          )}
        </Panel>
      )}
    </Wrap>
  );
}
