import { CATEGORIES, REGIONS } from '../data/generate';

/**
 * One place for how every chart looks. Colors are CSS variables (defined for light and dark in
 * styles/base.css), so a chart repaints with the theme without re-rendering.
 *
 * COLOR FOLLOWS THE ENTITY, never its rank: "Europe" is always slot 2, in every chart, whatever
 * filter is on. The colors are the validated categorical palette (a colorblind-safe order).
 */
export const seriesColor = (index) => `var(--series-${index + 1})`;
export const regionColor = (region) => seriesColor(REGIONS.indexOf(region));
export const categoryColor = (category) => seriesColor(CATEGORIES.indexOf(category));

/** Props shared by every axis, grid and legend so the charts look like one family */
export const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };
export const AXIS_LINE = { stroke: 'var(--axis)' };
export const GRID_STROKE = 'var(--grid)';
export const CHART_MARGIN = { top: 8, right: 16, bottom: 4, left: 4 };
const legendText = (value) => <span className="legend-text">{value}</span>;
export const LEGEND_PROPS = { iconSize: 10, itemSorter: null, formatter: legendText, wrapperStyle: { paddingTop: 8 } };
