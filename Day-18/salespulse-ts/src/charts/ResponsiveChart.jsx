import { ResponsiveContainer } from 'recharts';

/**
 * RESPONSIVE CONTAINER: Recharts draws at a fixed pixel size, so ResponsiveContainer measures its
 * parent and hands the chart that size. It needs a parent with a width; `height` is the one thing
 * you choose. `initialDimension` is what it assumes before the first measurement: without it the
 * chart renders nothing in a test (jsdom has no layout) and flashes empty in the browser.
 */
export default function ResponsiveChart({ height = 320, children }) {
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 720, height }}>
      {children}
    </ResponsiveContainer>
  );
}
