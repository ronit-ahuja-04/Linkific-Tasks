import { Moon, Sun } from 'lucide-react';
import { Tabs } from './components/Tabs';
import { TABS, SIZES, useData } from './context/DataContext';
import { useThemeActions, useThemeState } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import DirectoryScreen from './screens/DirectoryScreen';
import DashboardScreen from './screens/DashboardScreen';
import SearchLabScreen from './screens/SearchLabScreen';
import ProfileScreen from './screens/ProfileScreen';
import MethodsScreen from './screens/MethodsScreen';
import BenchmarkScreen from './screens/BenchmarkScreen';

export default function App() {
  const { tab, setTab, size, setSize, users } = useData();
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  const toast = useToast();

  const changeSize = (event) => {
    const next = Number(event.target.value);
    setSize(next);
    toast.info(`Dataset: ${next.toLocaleString()} users`);
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">D</span>
          <div>
            <h1>DataDesk</h1>
            <p>A Lodash lab: {users.length.toLocaleString()} users to search, group, clone and measure</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="size-picker">
            <span>Dataset</span>
            <select value={size} onChange={changeSize} aria-label="Dataset size">
              {SIZES.map((n) => <option key={n} value={n}>{n.toLocaleString()} users</option>)}
            </select>
          </label>
          <button type="button" className="icon-btn theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List aria-label="DataDesk sections" className="main-tabs">
          {TABS.map((t) => <Tabs.Tab key={t.id} value={t.id}>{t.label}</Tabs.Tab>)}
        </Tabs.List>
        <main id="main" tabIndex={-1}>
          <Tabs.Panel value="directory"><DirectoryScreen /></Tabs.Panel>
          <Tabs.Panel value="dashboard"><DashboardScreen /></Tabs.Panel>
          <Tabs.Panel value="search"><SearchLabScreen /></Tabs.Panel>
          <Tabs.Panel value="profile"><ProfileScreen /></Tabs.Panel>
          <Tabs.Panel value="methods"><MethodsScreen /></Tabs.Panel>
          <Tabs.Panel value="benchmark"><BenchmarkScreen /></Tabs.Panel>
        </main>
      </Tabs>
    </div>
  );
}
