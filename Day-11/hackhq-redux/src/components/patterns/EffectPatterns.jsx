import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Badge, Button, Card, Grid, Stack } from '../ui.jsx';

const Status = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875em;
  color: ${({ theme, $color }) => ($color ? theme.colors[$color] : theme.colors.muted)};
  opacity: ${({ $dim }) => ($dim ? 0.5 : 1)};
  strong {
    color: ${({ theme }) => theme.colors.ink};
  }
`;
const Strong = styled.strong`
  color: ${({ theme }) => theme.colors.ink};
`;
const Wrap = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;
const HeadRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;
const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;
const Lead = styled.p`
  margin: 0.25rem 0 0;
  max-width: 42rem;
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const PatternBox = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space(3)};
`;
const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
`;
const Sig = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const PTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0.75rem 0 0;
`;
const Desc = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const Foot = styled(Stack)`
  margin-top: ${({ theme }) => theme.space(4)};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding-top: ${({ theme }) => theme.space(3)};
`;

function Pattern({ tone, id, sig, title, desc, children }) {
  return (
    <PatternBox>
      <div>
        <TopRow>
          <Badge $tone={tone}>{id}</Badge>
          <Sig>{sig}</Sig>
        </TopRow>
        <PTitle>{title}</PTitle>
        <Desc>{desc}</Desc>
      </div>
      <Foot $gap={3}>{children}</Foot>
    </PatternBox>
  );
}

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
    <Status>
      Status: <Strong>{log}</Strong>
    </Status>
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
    <Wrap>
      <HeadRow>
        <div>
          <Title>useEffect Lifecycle Patterns</Title>
          <Lead>
            Interactive catalog showcasing dependency array variations, cleanup triggers, and
            anti-pattern protections.
          </Lead>
        </div>
        <Badge $tone="accent">9 Core Patterns</Badge>
      </HeadRow>

      <Grid $cols={{ base: 1, md: 2, xl: 3 }} $gap={3}>
        <Pattern
          tone="brand"
          id="EP-1"
          sig="deps: []"
          title="Run Once on Mount"
          desc="Executes once after paint and tears down on unmount. React StrictMode simulates
                  this cycle twice in dev."
        >
          {ep1Mounted ? <MountLoggerChild /> : <Status $dim>Child unmounted</Status>}
          <Button $variant="secondary" $size="sm" onClick={() => setEp1Mounted((prev) => !prev)}>
            {ep1Mounted ? 'Unmount Child' : 'Mount Child'}
          </Button>
        </Pattern>
        <Pattern
          tone="brand"
          id="EP-2"
          sig="deps: [ep2Count]"
          title="Specific Dependencies"
          desc="Executes only when dependent values change. Here, document.title updates when
                  count increments."
        >
          <Status>
            Current Count: <Strong>{ep2Count}</Strong>
          </Status>
          <Button $variant="secondary" $size="sm" onClick={() => setEp2Count((c) => c + 1)}>
            Increment Count (+1)
          </Button>
        </Pattern>
        <Pattern
          tone="warn"
          id="EP-3"
          sig="deps: none"
          title="Every Render Pass"
          desc="Runs after every paint for diagnostics. Calling setState inside this effect would
                  cause an infinite loop!"
        >
          <Status>
            Render passes: <Strong>{ep3Ticks}</Strong>
          </Status>
          <Button $variant="secondary" $size="sm" onClick={() => setEp3Ticks((t) => t + 1)}>
            Trigger Re-render
          </Button>
        </Pattern>
        <Pattern
          tone="brand"
          id="EP-4"
          sig="Multiple effects"
          title="Multiple Separate Effects"
          desc="Separates independent concerns into distinct effects rather than conflating them
                  into a single monolithic callback."
        >
          <Stack $dir="row" $gap={2} $wrap>
            <Button
              $variant="secondary"
              $size="sm"
              onClick={() => setEp4User((u) => (u === 'Admin' ? 'Lead' : 'Admin'))}
            >
              User: {ep4User}
            </Button>
            <Button $variant="secondary" $size="sm" onClick={() => setEp4Activity((a) => a + 1)}>
              Act: {ep4Activity}
            </Button>
          </Stack>
        </Pattern>
        <Pattern
          tone="good"
          id="EP-5"
          sig="Cleanup: Abort"
          title="Abort HTTP Requests"
          desc="Invokes AbortController.abort() to cancel in-flight HTTP requests and eliminate
                  race conditions."
        >
          <Status $color="good">Verified by: useFetch.js</Status>
        </Pattern>
        <Pattern
          tone="good"
          id="EP-6"
          sig="Cleanup: Timeout"
          title="Clear Timeout"
          desc="Calls clearTimeout on every new input stroke, buffering rapid typing events."
        >
          <Status $color="good">Verified by: useDebounce.js</Status>
        </Pattern>
        <Pattern
          tone="good"
          id="EP-7"
          sig="Cleanup: Interval"
          title="Clear Interval"
          desc="Calls clearInterval on pause or unmount, preventing timer duplication under
                  StrictMode."
        >
          <Status $color="good">Verified by: useStopwatch.js</Status>
        </Pattern>
        <Pattern
          tone="good"
          id="EP-8"
          sig="Cleanup: Listener"
          title="Remove Event Listener"
          desc="Unregisters global event listeners with identical function references to eliminate
                  memory leaks."
        >
          <Status $color="good">Verified by: useWindowSize.js</Status>
        </Pattern>
        <Pattern
          tone="accent"
          id="EP-9"
          sig="External Sync"
          title="Sync External System"
          desc="Synchronizes in-memory React state with browser localStorage with error-safe
                  fallbacks."
        >
          <Status $color="accent">Verified by: useLocalStorage.js</Status>
        </Pattern>
      </Grid>
    </Wrap>
  );
}
