import { ListGroup, Placeholder } from 'react-bootstrap';

/**
 * Accessible skeleton placeholder rows displayed while participant data is loading.
 * Complies with requirement PD-1.
 */
export function UserRowSkeleton({ count = 5 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <ListGroup role="status" aria-live="polite" aria-busy="true" aria-label="Loading participants">
      {items.map((idx) => (
        <ListGroup.Item key={idx} className="d-flex align-items-center gap-3 p-3">
          <Placeholder
            animation="glow"
            className="flex-shrink-0 rounded-circle overflow-hidden"
            style={{ width: 44, height: 44 }}
          >
            <Placeholder className="w-100 h-100" />
          </Placeholder>
          <Placeholder animation="glow" className="flex-grow-1">
            <Placeholder xs={6} className="d-block mb-2" />
            <Placeholder xs={9} size="sm" className="d-block" />
          </Placeholder>
        </ListGroup.Item>
      ))}
      <span className="visually-hidden">Loading participants list...</span>
    </ListGroup>
  );
}
