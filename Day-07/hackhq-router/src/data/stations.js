import {
  Users,
  CheckSquare,
  ShieldCheck,
  ShoppingBag,
  Code2,
  Globe,
  Clock,
  Layers,
} from 'lucide-react';

export const STATIONS = [
  { id: 'directory', name: 'Directory', icon: Globe, badge: 'Live API' },
  { id: 'clock', name: 'Hack Clock', icon: Clock, badge: 'Timer' },
  { id: 'patterns', name: 'Patterns', icon: Layers, badge: '9 Demos' },
  { id: 'checkin', name: 'Check-in', icon: Users, badge: 'Counter' },
  { id: 'checklist', name: 'Checklist', icon: CheckSquare, badge: 'Todo' },
  { id: 'teams', name: 'Teams', icon: ShieldCheck, badge: 'Form' },
  { id: 'swag', name: 'Swag shop', icon: ShoppingBag, badge: 'Cart' },
  { id: 'lab', name: 'State lab', icon: Code2, badge: 'X-ray / Lab' },
];

export const STATION_NAMES = {
  directory: 'Directory',
  clock: 'Hack Clock',
  patterns: 'Patterns',
  checkin: 'Check-in',
  checklist: 'Checklist',
  teams: 'Teams',
  swag: 'Swag shop',
  lab: 'State lab',
};
