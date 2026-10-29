import {
  Users,
  CheckSquare,
  UsersRound,
  ShoppingBag,
  FlaskConical,
} from 'lucide-react';

export const STATIONS = [
  { id: 'checkin', name: 'Check-in', icon: Users, badge: 'Counter' },
  { id: 'checklist', name: 'Checklist', icon: CheckSquare, badge: 'Todo' },
  { id: 'teams', name: 'Teams', icon: UsersRound, badge: 'Form' },
  { id: 'swag', name: 'Swag shop', icon: ShoppingBag, badge: 'Cart' },
  { id: 'lab', name: 'State lab', icon: FlaskConical, badge: 'X-ray / Lab' },
];

export const STATION_NAMES = {
  checkin: 'Check-in',
  checklist: 'Checklist',
  teams: 'Teams',
  swag: 'Swag shop',
  lab: 'State lab',
};
