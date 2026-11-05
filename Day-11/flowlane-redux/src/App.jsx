import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthStatus } from './store/slices/authSlice';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Logo from './components/Logo';

function App() {
  // REDUX: useSelector reads this slice of the store; the component re-renders only when it changes
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);

  if (status === 'loading') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', gap: 16}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <Logo size={32} />
          <h1 style={{fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0}}>FlowLane</h1>
        </div>
        <div style={{width: 200, height: 4, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden'}}>
          <div className="loader-bar" style={{height: '100%', background: 'var(--primary-color)'}} />
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .loader-bar { animation: load 1.5s ease-in-out infinite; width: 30%; }
          @keyframes load { 0% { transform: translateX(-100%); } 50% { transform: translateX(250%); } 100% { transform: translateX(-100%); } }
        `}} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/*" 
          element={user ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/auth" 
          element={!user ? <Auth /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
