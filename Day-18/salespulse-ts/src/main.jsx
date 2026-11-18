import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import { api, createApi } from './api/mockApi';

// The API is pretend, so it can be told to fail: open the page with ?fail=1 to see the error banner and Try again
const demoApi = new URLSearchParams(window.location.search).has('fail') ? createApi({ failTimes: 1 }) : api;

createRoot(document.getElementById('root')).render(
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
