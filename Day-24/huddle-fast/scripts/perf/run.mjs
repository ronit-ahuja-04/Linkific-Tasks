// ALL MEASUREMENTS for one label:   PERF_LABEL=before npm run perf
// bundle (builds dist/ and the treemap) -> Lighthouse (median of RUNS, default 3) -> interactions -> docs/perf/<label>.md
// Needs the local stack (npm run db:start) and the test data (node scripts/perf-data.mjs add). About 10 minutes.
import { build, measureBundle } from './bundle.mjs';
import { runInteractions } from './interactions.mjs';
import { runLighthouse } from './lighthouse.mjs';
import { writeReport } from './report.mjs';
import { LABEL } from './common.mjs';

console.log(`[perf] ${LABEL}: building and measuring the bundle…`);
build();
measureBundle();
console.log('[perf] Lighthouse…');
await runLighthouse();
console.log('[perf] interactions…');
await runInteractions();
console.log(`[perf] report: ${writeReport(LABEL)}`);
