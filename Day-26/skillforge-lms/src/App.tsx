import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch } from './app/hooks';
import { store } from './app/store';
import { MotionProvider } from './components/MotionProvider';
import { hydrateAuth } from './features/auth/authSlice';
import { hydrateUiPrefs } from './features/ui/uiSlice';
import { subscribeToAuthChanges } from './lib/api/authApi';
import { AppRouter } from './routes/AppRouter';

function AppBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateUiPrefs());
    void dispatch(hydrateAuth());
    return subscribeToAuthChanges(() => {
      void dispatch(hydrateAuth());
    });
  }, [dispatch]);

  return <AppRouter />;
}

export function App() {
  return (
    <Provider store={store}>
      <MotionProvider>
        <BrowserRouter>
          <AppBootstrap />
        </BrowserRouter>
      </MotionProvider>
    </Provider>
  );
}
