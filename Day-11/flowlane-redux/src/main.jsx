import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import App from './App.jsx'
import { store } from './store'
import { startAuthListener } from './store/listeners'

// REDUX: report Firebase sign-ins and sign-outs into the store as soon as the app starts
startAuthListener(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* REDUX: Provider makes the store available to every component below */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
