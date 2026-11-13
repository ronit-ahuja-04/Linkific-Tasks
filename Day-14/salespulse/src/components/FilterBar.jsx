import { RotateCcw } from 'lucide-react';
import { RANGES, useDashboard } from '../context/DashboardContext';
import { CATEGORIES, REGIONS } from '../data/generate';
import { ALL } from '../lib/metrics';

/**
 * The one row of filters above every chart. They scope everything below them, so all the numbers
 * on the page always agree. The range asks the API again (the old charts stay on screen, faded);
 * region and category filter the data already in the browser, so they are instant.
 */
export default function FilterBar() {
  const { selectedRange, setRange, region, setRegion, category, setCategory, hasFilters, reset, loading, refreshing, error, retry } = useDashboard();
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
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value={ALL}>All regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="filter-group">
          <span className="filter-label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value={ALL}>All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-sm" onClick={reset} disabled={!hasFilters}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
        <p className="filter-status" role="status" aria-live="polite">
          {loading ? 'Loading data…' : refreshing ? 'Updating…' : ''}
        </p>
      </div>
      {error && (
        <div className="banner-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm" onClick={retry}>Try again</button>
        </div>
      )}
    </>
  );
}
