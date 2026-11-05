import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, authErrorCleared, selectAuthBusy, selectAuthError } from '../store/slices/authSlice';
import Logo from '../components/Logo';
import '../index.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // REDUX: useDispatch returns the store's dispatch; thunks and plain actions are sent through it
  const dispatch = useDispatch();
  // REDUX: useSelector reads this slice of the store; the component re-renders only when it changes
  const busy = useSelector(selectAuthBusy);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();

  const clearError = () => {
    if (error) dispatch(authErrorCleared());
  };

  const run = async (thunkAction) => {
    try {
      await dispatch(thunkAction).unwrap();
      navigate('/');
    } catch {
      // the readable message is already in the store (state.auth.error)
    }
  };

  const handleGoogleSignIn = () => run(signInWithGoogle());

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(authErrorCleared());
    run((isLogin ? signInWithEmail : signUpWithEmail)({ email, password }));
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <Logo size={42} />
          <h2>FlowLane</h2>
        </div>
        
        <div className="auth-hero-graphic">
          <img src="/auth-hero.jpg" alt="Project Management Flow" />
        </div>

        <div className="auth-hero-text">
          <h1>Manage your projects in flow.</h1>
          <p>Collaborate with your team, sync your calendar, and get more done.</p>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-box">
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Enter your details to access your workspace.' : 'Sign up to start collaborating today.'}
          </p>

          <button onClick={handleGoogleSignIn} className="google-btn" disabled={busy}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign {isLogin ? 'in' : 'up'} with Google
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="hello@flowlane.com" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={busy}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); clearError(); }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
