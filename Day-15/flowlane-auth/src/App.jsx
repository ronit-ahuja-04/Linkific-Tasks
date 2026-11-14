import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import AuthAction from './pages/AuthAction';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import Logo from './components/Logo';

function App() {
  // CONTEXT: useAuth() is our custom hook around useContext(AuthContext)
  const { status } = useAuth();

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
        {/* Public-only: signed-in users are sent back to where they came from */}
        <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        {/* Public: the links in Firebase emails work signed in or out */}
        <Route path="/auth/action" element={<AuthAction />} />
        {/* Everything else is the app, for signed-in users only (Dashboard handles /projects/:id, /settings...) */}
        <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
