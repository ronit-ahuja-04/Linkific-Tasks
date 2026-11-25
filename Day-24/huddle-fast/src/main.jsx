import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles/base.css';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { preloadPath } from './routes';

// Start downloading the current page's chunk NOW, in parallel with React starting and the session check, instead of
// after them (a "waterfall": app code, then session, then page code). Without a stored session the visitor is about
// to be sent to /login, so fetch that page too. (supabase-js keeps the session in localStorage as sb-<ref>-auth-token.)
preloadPath(window.location.pathname);
try {
  if (!Object.keys(localStorage).some((key) => /^sb-.+-auth-token$/.test(key))) preloadPath('/login');
} catch {
  // storage blocked: the redirect will load the page when needed
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
