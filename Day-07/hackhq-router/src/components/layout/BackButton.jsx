import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * CONCEPT: History delta - navigate(-1) is the browser Back button, triggered from code.
 * BrowserRouter stores an `idx` in history.state; idx 0 means this is the first page of
 * the session (e.g. opened from a shared link), so going back would leave the app.
 */
export default function BackButton({ fallback = '/', label = 'Back' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button type="button" className="btn btn-secondary back-button" onClick={handleBack}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
