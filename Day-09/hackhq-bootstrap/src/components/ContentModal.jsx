import { Modal } from 'react-bootstrap';

/**
 * CONCEPT: One Modal, dynamic content - the caller keeps "what to show" in state (a product, a user)
 * and passes it in as children, so a single component serves every quick view.
 * React Bootstrap handles the backdrop, focus trap, Escape key and aria attributes.
 */
export default function ContentModal({ show, onHide, title, footer, size, children }) {
  return (
    <Modal show={show} onHide={onHide} size={size} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="fs-4 fw-bold">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  );
}
