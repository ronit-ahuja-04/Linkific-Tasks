// RENDER COUNTER, injected into the page BEFORE React loads (Playwright addInitScript).
// It installs the same hook React DevTools uses (via bippy, the library behind react-scan), and after every React
// commit walks the fibers that actually rendered, counting them per component name.
// The app has no test code in it: this is how the DevTools Profiler sees renders too.
//
//   window.__renders.reset()   start counting from zero
//   window.__renders.read()    { commits, total, byComponent: { MessageItem: 12, ... } }
import { getDisplayName, instrument, isCompositeFiber, traverseRenderedFibers } from 'bippy';

let commits = 0;
let counts = new Map();

instrument({
  onCommitFiberRoot(_rendererId, root) {
    commits += 1;
    traverseRenderedFibers(root.current, (fiber) => {
      if (!isCompositeFiber(fiber)) return;
      const name = getDisplayName(fiber.type) ?? 'Anonymous';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
  },
});

window.__renders = {
  reset() {
    commits = 0;
    counts = new Map();
  },
  read() {
    const byComponent = Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1]));
    return { commits, total: [...counts.values()].reduce((a, b) => a + b, 0), byComponent };
  },
};
