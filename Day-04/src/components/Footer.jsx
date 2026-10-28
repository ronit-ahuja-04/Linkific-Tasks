import './Footer.css';

/**
 * Reusable Footer component demonstrating:
 * - Simple string & number props
 * - Dynamic default parameter expressions: `year = new Date().getFullYear()`
 * - Semantic footer markup
 */
function Footer({
  text = 'DevHub Platform · High-velocity developer ecosystem built with React 19, Vite, and modular component architecture.',
  year = new Date().getFullYear(),
  brand = 'DevHub',
}) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-brand-row">
          <div className="footer-brand-header">
            <span className="footer-logo">⚡ {brand}</span>
            <span className="footer-status-pill">
              <span className="footer-status-dot"></span>
              All Systems Operational
            </span>
          </div>
          <p className="footer-text">{text}</p>
        </div>

        <div className="footer-bottom-row">
          <p className="footer-copyright">
            &copy; {year} {brand} Inc. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="#network" className="footer-link">Network</a>
            <span className="footer-dot">&bull;</span>
            <a href="#tooling" className="footer-link">Tooling</a>
            <span className="footer-dot">&bull;</span>
            <a href="#publications" className="footer-link">Publications</a>
            <span className="footer-dot">&bull;</span>
            <a href="#jsx-studio" className="footer-link">JSX Studio</a>
            <span className="footer-dot">&bull;</span>
            <a
              href="https://github.com/ronit-ahuja-04/Linkific-Tasks"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub &nearr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
