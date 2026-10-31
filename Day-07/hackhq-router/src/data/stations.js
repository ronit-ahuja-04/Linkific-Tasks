import {
  CheckSquare,
  ShieldCheck,
  ShoppingBag,
  Globe,
  Clock,
  Layers,
  LayoutDashboard,
  Info,
  Mail,
  Lock,
} from 'lucide-react';

/**
 * Single source of truth for every navigable page (RC-1).
 * `path` is absolute so links never resolve relative to the current route.
 */
export const STATIONS = [
  {
    id: 'home',
    path: '/',
    name: 'Mission control',
    icon: LayoutDashboard,
    badge: 'Index',
    description: 'Overview of every station in the control room.',
  },
  {
    id: 'directory',
    path: '/directory',
    name: 'Directory',
    icon: Globe,
    badge: 'Live API',
    description: 'Search attendees and read their posts, fetched live from DummyJSON.',
  },
  {
    id: 'clock',
    path: '/clock',
    name: 'Hack Clock',
    icon: Clock,
    badge: 'Timer',
    description: 'Stopwatch with persisted laps for demo-day time boxes.',
  },
  {
    id: 'patterns',
    path: '/patterns',
    name: 'Patterns',
    icon: Layers,
    badge: '9 Demos',
    description: 'Nine interactive useEffect lifecycle demos.',
  },
  {
    id: 'checklist',
    path: '/checklist',
    name: 'Checklist',
    icon: CheckSquare,
    badge: 'Todo',
    description: 'Organizer whiteboard with filters, edits and undo.',
  },
  {
    id: 'teams',
    path: '/teams',
    name: 'Teams',
    icon: ShieldCheck,
    badge: 'Form',
    description: 'Register teams with live validation and a lanyard preview.',
  },
  {
    id: 'swag',
    path: '/swag',
    name: 'Swag shop',
    icon: ShoppingBag,
    badge: 'Cart',
    description: 'Pop-up merch store with coupons and a thermal receipt.',
  },
  {
    id: 'organizer',
    path: '/organizer',
    name: 'Organizer',
    icon: Lock,
    badge: 'Guarded',
    description: 'Check-in and State lab, behind a protected route.',
  },
  {
    id: 'contact',
    path: '/contact',
    name: 'Contact',
    icon: Mail,
    badge: 'Form',
    description: 'Message the organizers; submitting navigates with replace.',
  },
  {
    id: 'about',
    path: '/about',
    name: 'About',
    icon: Info,
    badge: 'Static',
    description: 'The event, the project, and Link vs <a> side by side.',
  },
];
