import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import { api, createApi } from './api/mockApi';

// The API is pretend, so it can be told to fail: open the page with ?fail=1 to see the error banner and Try again
// `VITE_API_DELAY_MS` is typed by src/declarations/env.d.ts; env values are strings (or absent), so it is parsed and checked
const envDelay = Number(import.meta.env.VITE_API_DELAY_MS);
const delayMs = Number.isFinite(envDelay) && import.meta.env.VITE_API_DELAY_MS ? envDelay : undefined;
const wantsFailure = new URLSearchParams(window.location.search).has('fail');
const demoApi = wantsFailure || delayMs !== undefined ? createApi({ ...(delayMs !== undefined ? { delayMs } : {}), ...(wantsFailure ? { failTimes: 1 } : {}) }) : api;
// `__APP_VERSION__` is declared in src/declarations/globals.d.ts and replaced by Vite at build time
document.documentElement.dataset.version = __APP_VERSION__;

const container = document.getElementById('root');
if (!container) throw new Error('index.html has no #root element to render into.');

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <DashboardProvider api={demoApi}>
          <App />
        </DashboardProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
