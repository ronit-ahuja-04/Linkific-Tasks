import { useState, useEffect } from 'react';

/**
 * Custom hook managing a stopwatch with 100ms interval resolution.
 *
 * NOTE: Tick-counting intervals may experience minor drift over long periods
 * due to browser timer scheduling jitter. For mission-critical precision,
 * timestamp delta subtraction (Date.now()) is preferred.
 *
 * @returns {{
 *   elapsed: number,
 *   running: boolean,
 *   start: () => void,
 *   pause: () => void,
 *   reset: () => void
 * }}
 */
export function useStopwatch() {
  // CONCEPT: useStopwatch - interval timer with functional update and clearInterval cleanup
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    // Use functional state update so interval never depends on stale elapsed closure
    const intervalId = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return { elapsed, running, start, pause, reset };
}

