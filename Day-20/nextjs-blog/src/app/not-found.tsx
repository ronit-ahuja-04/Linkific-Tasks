import Link from 'next/link';

/** The 404 page for any address that matches no route */
export default function NotFound() {
  return (
    <div className="error-box">
      <h1>Page not found</h1>
      <p>That address does not exist on this site.</p>
      <Link href="/" className="btn-primary">Go home</Link>
    </div>
  );
}
