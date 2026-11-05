/**
 * Seed announcements. Read-only: organizer edits live in localStorage and are merged on top
 * by lib/announcements.js, so this list never changes at runtime.
 * Times are fixed so the demo looks the same on every machine.
 */
const at = (day, hour, minute = 0) => Date.UTC(2026, 9, day, hour, minute);

export const SEED_ANNOUNCEMENTS = [
  {
    id: 'seed-welcome',
    title: 'Welcome to HackHQ day',
    body: 'Doors are open. Grab your lanyard at the check-in desk, find a table, and say hello to your mentors. Hacking starts at the opening keynote.',
    category: 'General',
    pinned: true,
    createdAt: at(31, 3, 30),
  },
  {
    id: 'seed-keynote',
    title: 'Opening keynote moved to the main hall',
    body: 'The keynote now starts at 10:00 in the main hall instead of Room B. Doors close five minutes after the start, so please arrive early.',
    category: 'Schedule',
    pinned: false,
    createdAt: at(31, 4, 15),
  },
  {
    id: 'seed-lunch',
    title: 'Lunch is served from 13:00',
    body: 'Pizza, salad bar and a vegan option are waiting in the east lobby. Please bring your own bottle and use the refill stations.',
    category: 'Food',
    pinned: false,
    createdAt: at(31, 6, 45),
  },
  {
    id: 'seed-swag',
    title: 'Swag desk is open',
    body: 'Pick up your decal pack and tee at the swag desk, next to check-in. Hoodies are limited, so use the swag shop page to reserve yours.',
    category: 'Swag',
    pinned: false,
    createdAt: at(31, 7, 0),
  },
  {
    id: 'seed-wifi',
    title: 'Wi-Fi password changed',
    body: 'The venue network was reset. Use the HackHQ-Guest network with the password on the signage at every table. Ask a volunteer if it fails.',
    category: 'Urgent',
    pinned: true,
    createdAt: at(31, 8, 20),
  },
  {
    id: 'seed-demos',
    title: 'Demo sign-ups close at 16:00',
    body: 'Each team gets three minutes on the main stage. Add your team to the demo list at the organizer desk before 16:00 to get a slot.',
    category: 'Schedule',
    pinned: false,
    createdAt: at(31, 9, 10),
  },
  {
    id: 'seed-snacks',
    title: 'Late-night snacks',
    body: 'Fruit, noodles and coffee will be restocked every two hours in the east lobby until midnight. Please clear your tables when you leave.',
    category: 'Food',
    pinned: false,
    createdAt: at(31, 11, 30),
  },
];
