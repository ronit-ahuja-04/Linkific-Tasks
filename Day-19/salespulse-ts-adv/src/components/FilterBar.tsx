import { RotateCcw } from 'lucide-react';
import { RANGES, useDashboard } from '../context/DashboardContext';
import { CATEGORIES, REGIONS } from '../data/generate';
import { isCategoryFilter, isRegionFilter } from '../lib/guards';
import { assertNever } from '../lib/exhaustive';
import { ALL } from '../lib/metrics';
import type { DashboardStatus } from '../types';

/** The words under the filters for each status. A `switch` over the union: remove a case and `assertNever` stops compiling. */
function statusText(status: DashboardStatus): string {
  switch (status.kind) {
    case 'loading': return 'Loading data…';
    case 'refreshing': return 'Updating…';
    case 'error':
    case 'ready': return '';
    default: return assertNever(status, 'dashboard status');
  }
}

/**
 * The one row of filters above every chart. They scope everything below them, so all the numbers
 * on the page always agree. The range asks the API again (the old charts stay on screen, faded);
 * region and category filter the data already in the browser, so they are instant.
 */
export default function FilterBar() {
  const { selectedRange, setRange, region, setRegion, category, setCategory, hasFilters, reset, status, retry } = useDashboard();
  return (
    <>
      <div className="filter-bar" role="group" aria-label="Dashboard filters">
        <fieldset className="filter-group">
          <legend>Period</legend>
          <div className="segmented">
            {RANGES.map((months) => (
              <button key={months} type="button" aria-pressed={selectedRange === months} onClick={() => setRange(months)}>
                {months} months
              </button>
            ))}
          </div>
        </fieldset>
        <label className="filter-group">
          <span className="filter-label">Region</span>
          <select value={region} onChange={(e) => { if (isRegionFilter(e.target.value)) setRegion(e.target.value); }}>
            <option value={ALL}>All regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="filter-group">
          <span className="filter-label">Category</span>
          <select value={category} onChange={(e) => { if (isCategoryFilter(e.target.value)) setCategory(e.target.value); }}>
            <option value={ALL}>All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-sm" onClick={reset} disabled={!hasFilters}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
        <p className="filter-status" role="status" aria-live="polite">
          {statusText(status)}
        </p>
      </div>
      {status.kind === 'error' && (
        <div className="banner-error" role="alert">
          <span>{status.message}</span>
          <button type="button" className="btn btn-sm" onClick={retry}>Try again</button>
        </div>
      )}
    </>
  );
}
