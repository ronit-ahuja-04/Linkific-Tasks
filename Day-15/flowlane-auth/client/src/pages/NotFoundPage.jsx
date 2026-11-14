import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'FlowLane · Page not found';
  }, []);
  return (
    <main id="main" className="card" style={{ maxWidth: 480, margin: '64px auto', padding: 24, textAlign: 'center' }}>
      <h1>404</h1>
      <p>We could not find that page.</p>
      <Link className="btn btn-primary" to="/">Go home</Link>
    </main>
  );
}
