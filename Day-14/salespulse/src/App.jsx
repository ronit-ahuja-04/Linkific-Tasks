import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Tabs } from './components/Tabs';
import FilterBar from './components/FilterBar';
import { useDashboard } from './context/DashboardContext';
import { useThemeActions, useThemeState } from './context/ThemeContext';
import OverviewScreen from './screens/OverviewScreen';
import SalesScreen from './screens/SalesScreen';
import UsersScreen from './screens/UsersScreen';
import RevenueScreen from './screens/RevenueScreen';
import ExploreScreen from './screens/ExploreScreen';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'users', label: 'Users' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'explore', label: 'Explore' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const { ready, loading } = useDashboard();
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <div>
            <h1>SalesPulse</h1>
            <p>A Recharts dashboard over mock sales and user data</p>
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
          {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </header>
      <FilterBar />
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List aria-label="Dashboard sections">
          {TABS.map((t) => <Tabs.Tab key={t.id} value={t.id}>{t.label}</Tabs.Tab>)}
        </Tabs.List>
        <main id="main" tabIndex={-1}>
          {loading && !ready ? (
            <p className="muted" role="status">Loading the dashboard…</p>
          ) : (
            <>
              <Tabs.Panel value="overview"><OverviewScreen /></Tabs.Panel>
              <Tabs.Panel value="sales"><SalesScreen /></Tabs.Panel>
              <Tabs.Panel value="users"><UsersScreen /></Tabs.Panel>
              <Tabs.Panel value="revenue"><RevenueScreen /></Tabs.Panel>
              <Tabs.Panel value="explore"><ExploreScreen /></Tabs.Panel>
            </>
          )}
        </main>
      </Tabs>
    </div>
  );
}
