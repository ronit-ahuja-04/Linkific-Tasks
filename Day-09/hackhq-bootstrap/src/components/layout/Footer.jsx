import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Zap } from 'lucide-react';

const LINKS = [
  { to: '/directory', label: 'Directory' },
  { to: '/swag', label: 'Swag shop' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/contact', label: 'Contact' },
  { to: '/about', label: 'About' },
];

/**
 * CONCEPT: Responsive order and offset - below `md` the links come first (order 1) and the brand
 * second; from `md` up the brand is first and the links sit in the right half after a 1-column gap.
 */
export default function Footer() {
  return (
    <footer className="border-top mt-auto">
      <Container fluid className="app-shell px-3 px-sm-4 py-4">
        <Row className="align-items-center gy-3">
          <Col
            xs={{ span: 12, order: 2 }}
            md={{ span: 6, order: 1 }}
            xl={5}
            className="d-flex align-items-center gap-3"
          >
            <span
              className="bg-brand d-grid rounded-2"
              style={{ width: '2rem', height: '2rem', placeItems: 'center' }}
              aria-hidden="true"
            >
              <Zap size={16} strokeWidth={2.5} />
            </span>
            <p className="small text-body-secondary mb-0">
              <span className="fw-bold text-body">HackHQ</span> · built with React Router and
              Bootstrap
            </p>
          </Col>
          <Col
            as="nav"
            aria-label="Footer"
            xs={{ span: 12, order: 1 }}
            md={{ span: 5, offset: 1, order: 2 }}
            xl={{ span: 6, offset: 1 }}
          >
            <ul className="list-unstyled d-flex flex-wrap column-gap-4 row-gap-2 small mb-0">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="link-secondary link-underline-opacity-0">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
