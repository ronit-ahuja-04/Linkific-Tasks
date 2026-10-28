import './Footer.css';

/**
 * Reusable Footer component demonstrating:
 * - Simple string & number props
 * - Dynamic default parameter expressions: `year = new Date().getFullYear()`
 * - Semantic footer markup
 */
function Footer({
  text = 'Built with React 19 & Vite for Linkific Day 4 React Basics.',
  year = new Date().getFullYear(),
  brand = 'DevHub',
}) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-brand-row">
          <span className="footer-logo">⚡ {brand}</span>
          <p className="footer-text">{text}</p>
        </div>

        <div className="footer-bottom-row">
          <p className="footer-copyright">
            &copy; {year} {brand}. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="#components" className="footer-link">Components</a>
            <span className="footer-dot">&bull;</span>
            <a href="#jsx-demo" className="footer-link">JSX Demo</a>
            <span className="footer-dot">&bull;</span>
            <a href="#github" className="footer-link">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
