import { Provider as ReduxProvider } from 'react-redux';
import { store as defaultStore } from '../store';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';

/**
 * CONTEXT COMPOSITION: every provider in one place, in dependency order.
 *
 *   Redux store        server data (projects, board, ...), available to everything
 *     AuthProvider     who is signed in
 *       ThemeProvider  needs Auth (saves the theme on the user's profile), so it goes inside it
 *         LanguageProvider
 *
 * Order matters only where one provider uses another: ThemeProvider calls useAuth(), so
 * AuthProvider must wrap it. Keeping them here means main.jsx and the tests wrap the app the same way.
 */
export default function AppProviders({ children, store = defaultStore }) {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
