import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// CONCEPT: BrowserRouter - one router at the root so every Link, Route and router hook has a parent.
// useTransitions={false}: by default location updates run inside startTransition, so on logout the
// urgent `isOrganizer = false` rendered first while still on /organizer and the guard bounced to
// /login. Synchronous updates let the logout and navigate('/') land in the same render.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter useTransitions={false}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
