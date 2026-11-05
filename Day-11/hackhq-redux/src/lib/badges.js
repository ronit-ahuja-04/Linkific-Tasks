import { calculateTotalItemCount } from './cart.js';
import { calculateProgress } from './checklist.js';

/**
 * Badge definitions. `check(state)` is a pure function of the Redux state, so it can be tested
 * without a store. The listener middleware runs every check after each state change.
 */
export const BADGES = [
  {
    id: 'first-save',
    name: 'Wish upon a star',
    description: 'Save a product to your wishlist',
    icon: 'heart',
    check: (s) => s.wishlist.ids.length >= 1,
  },
  {
    id: 'collector',
    name: 'Swag collector',
    description: 'Have 5 items in your cart',
    icon: 'bag',
    check: (s) => calculateTotalItemCount(s.cart.items) >= 5,
  },
  {
    id: 'finisher',
    name: 'Mission complete',
    description: 'Finish every checklist task (3 or more tasks)',
    icon: 'check',
    check: (s) => calculateProgress(s.tasks.items).isComplete,
  },
  {
    id: 'planner',
    name: 'Planner',
    description: 'Save 3 sessions to your schedule',
    icon: 'calendar',
    check: (s) => s.schedule.savedIds.length >= 3,
  },
  {
    id: 'time-keeper',
    name: 'Time keeper',
    description: 'Record 3 laps on the Hack Clock',
    icon: 'clock',
    check: (s) => s.laps.items.length >= 3,
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'Load the attendee directory',
    icon: 'globe',
    check: (s) => s.users.list.status === 'succeeded',
  },
  {
    id: 'town-crier',
    name: 'Town crier',
    description: 'Publish an announcement as an organizer',
    icon: 'megaphone',
    check: (s) => s.announcements.changes.added.length >= 1,
  },
  {
    id: 'backstage',
    name: 'Backstage pass',
    description: 'Log in as an organizer',
    icon: 'lock',
    check: (s) => s.auth.isOrganizer,
  },
];

/** Badges whose condition is met in `state` and that are not in `earned` yet */
export function evaluateBadges(state, earned = {}) {
  return BADGES.filter((badge) => !earned[badge.id] && badge.check(state));
}

/** Short, safe, single-line preview of an action payload for the activity feed */
export function previewPayload(payload, max = 70) {
  if (payload === undefined) return '';
  let text;
  try {
    text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  } catch {
    return '';
  }
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
