import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppProviders from './context/AppProviders.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Redux for server data, Context for the user, theme and language (see context/AppProviders.jsx) */}
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
