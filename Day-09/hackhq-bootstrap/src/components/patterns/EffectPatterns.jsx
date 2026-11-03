import { useState, useEffect } from 'react';
import { Card as BsCard, Col, Row } from 'react-bootstrap';
import { Badge, Button, Card } from '../ui.jsx';

const STATUS = 'font-monospace small text-body-secondary';

/**
 * Child component for EP-1 to demonstrate mount and unmount lifecycles.
 */
function MountLoggerChild() {
  const [log, setLog] = useState('Mounted');

  useEffect(() => {
    // CONCEPT: EP-1 - Run once effect ([])
    console.log(
      '[EP-1] MountLoggerChild mounted (runs once). In StrictMode, runs mount -> cleanup -> mount.'
    );
    setLog('Active (Mount effect ran)');

    return () => {
      console.log('[EP-1] MountLoggerChild unmounted (cleanup ran).');
    };
  }, []);

  return (
    <div className={STATUS}>
      Status: <strong className="text-body">{log}</strong>
    </div>
  );
}

/**
 * 9-Pattern Effect Reference Panel.
 * Demonstrates all primary useEffect lifecycle signatures and cleanup mechanics.
 * Complies with requirements EP-1 through EP-9.
 */
export function EffectPatterns() {
  // EP-1 state: toggle child to demonstrate mount/cleanup cycles
  const [ep1Mounted, setEp1Mounted] = useState(true);

  // EP-2 state: counter driving document.title
  const [ep2Count, setEp2Count] = useState(0);
  useEffect(() => {
    // CONCEPT: EP-2 - Specific dependencies ([ep2Count])
    document.title = `HackHQ Live: Count ${ep2Count}`;
  }, [ep2Count]);

  // EP-3 state: render trigger counter (logs every render, no setState inside)
  const [ep3Ticks, setEp3Ticks] = useState(0);
  useEffect(() => {
    // CONCEPT: EP-3 - Every render effect (no dependency array)
    console.log(`[EP-3] Effect executed after render pass. Ticks: ${ep3Ticks}`);
  });

  // EP-4 state: multiple effects for independent concerns
  const [ep4User, setEp4User] = useState('Admin');
  const [ep4Activity, setEp4Activity] = useState(0);
  useEffect(() => {
    console.log(`[EP-4] Concern A: User switched to ${ep4User}`);
  }, [ep4User]);
  useEffect(() => {
    console.log(`[EP-4] Concern B: Activity updated to ${ep4Activity}`);
  }, [ep4Activity]);

  return (
    <Card className="gap-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h2 className="fs-4 fw-bold mb-0">useEffect Lifecycle Patterns</h2>
          <p className="mt-1 mb-0 small text-body-secondary" style={{ maxWidth: '42rem' }}>
            Interactive catalog showcasing dependency array variations, cleanup triggers, and
            anti-pattern protections.
          </p>
        </div>
        <Badge tone="accent">9 Core Patterns</Badge>
      </div>

      <Row xs={1} md={2} xl={3} className="g-3">
        {/* EP-1: Run once ([]) */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="brand">EP-1</Badge>
                <span className="font-monospace small text-body-secondary">deps: []</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Run Once on Mount</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Executes once after paint and tears down on unmount. React StrictMode simulates
                  this cycle twice in dev.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              {ep1Mounted ? (
                <MountLoggerChild />
              ) : (
                <div className={STATUS + ' opacity-50'}>Child unmounted</div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setEp1Mounted((prev) => !prev)}>
                {ep1Mounted ? 'Unmount Child' : 'Mount Child'}
              </Button>
            </div>
          </BsCard>
        </Col>

        {/* EP-2: Specific dependencies */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="brand">EP-2</Badge>
                <span className="font-monospace small text-body-secondary">deps: [ep2Count]</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Specific Dependencies</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Executes only when dependent values change. Here, document.title updates when
                  count increments.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS}>
                Current Count: <strong className="text-body">{ep2Count}</strong>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEp2Count((c) => c + 1)}>
                Increment Count (+1)
              </Button>
            </div>
          </BsCard>
        </Col>

        {/* EP-3: Every render */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="warn">EP-3</Badge>
                <span className="font-monospace small text-body-secondary">deps: none</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Every Render Pass</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Runs after every paint for diagnostics. Calling setState inside this effect would
                  cause an infinite loop!
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS}>
                Render passes: <strong className="text-body">{ep3Ticks}</strong>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEp3Ticks((t) => t + 1)}>
                Trigger Re-render
              </Button>
            </div>
          </BsCard>
        </Col>

        {/* EP-4: Multiple effects */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="brand">EP-4</Badge>
                <span className="font-monospace small text-body-secondary">Multiple effects</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Multiple Separate Effects</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Separates independent concerns into distinct effects rather than conflating them
                  into a single monolithic callback.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEp4User((u) => (u === 'Admin' ? 'Lead' : 'Admin'))}
                >
                  User: {ep4User}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEp4Activity((a) => a + 1)}>
                  Act: {ep4Activity}
                </Button>
              </div>
            </div>
          </BsCard>
        </Col>

        {/* EP-5: Cleanup abort fetch */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="good">EP-5</Badge>
                <span className="font-monospace small text-body-secondary">Cleanup: Abort</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Abort HTTP Requests</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Invokes AbortController.abort() to cancel in-flight HTTP requests and eliminate
                  race conditions.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS + ' text-success'}>Verified by: useFetch.js</div>
            </div>
          </BsCard>
        </Col>

        {/* EP-6: Cleanup timeout */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="good">EP-6</Badge>
                <span className="font-monospace small text-body-secondary">Cleanup: Timeout</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Clear Timeout</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Calls clearTimeout on every new input stroke, buffering rapid typing events.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS + ' text-success'}>Verified by: useDebounce.js</div>
            </div>
          </BsCard>
        </Col>

        {/* EP-7: Cleanup interval */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="good">EP-7</Badge>
                <span className="font-monospace small text-body-secondary">Cleanup: Interval</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Clear Interval</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Calls clearInterval on pause or unmount, preventing timer duplication under
                  StrictMode.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS + ' text-success'}>Verified by: useStopwatch.js</div>
            </div>
          </BsCard>
        </Col>

        {/* EP-8: Cleanup listener */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="good">EP-8</Badge>
                <span className="font-monospace small text-body-secondary">Cleanup: Listener</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Remove Event Listener</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Unregisters global event listeners with identical function references to eliminate
                  memory leaks.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS + ' text-success'}>Verified by: useWindowSize.js</div>
            </div>
          </BsCard>
        </Col>

        {/* EP-9: Sync external system */}
        <Col>
          <BsCard className="h-100 justify-content-between bg-body-tertiary p-3">
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <Badge tone="accent">EP-9</Badge>
                <span className="font-monospace small text-body-secondary">External Sync</span>
              </div>
              <div className="mt-3">
                <h3 className="fs-6 fw-semibold mb-0">Sync External System</h3>
                <p className="mt-2 mb-0 small text-body-secondary">
                  Synchronizes in-memory React state with browser localStorage with error-safe
                  fallbacks.
                </p>
              </div>
            </div>
            <div className="mt-4 d-flex flex-column gap-3 border-top pt-3">
              <div className={STATUS + ' text-primary'}>Verified by: useLocalStorage.js</div>
            </div>
          </BsCard>
        </Col>
      </Row>
    </Card>
  );
}
