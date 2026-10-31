import { STATIONS } from '../data/stations.js';
import { SWAG_PRODUCTS } from '../data/products.js';
import { productPath } from './routes.js';

/**
 * Pure data for the W5 command palette: every page plus every product,
 * each with an absolute path to navigate() to.
 */
export function buildCommands() {
  const pages = STATIONS.map((station) => ({
    id: `page-${station.id}`,
    group: 'Pages',
    label: station.name,
    hint: station.path,
    path: station.path,
    keywords: station.description,
  }));

  const extras = [
    {
      id: 'page-nav-patterns',
      group: 'Pages',
      label: 'Navigation patterns',
      hint: '/patterns/navigation',
      path: '/patterns/navigation',
      keywords: 'push replace back forward redirect useNavigate',
    },
  ];

  const products = SWAG_PRODUCTS.map((product) => ({
    id: `product-${product.id}`,
    group: 'Products',
    label: product.name,
    hint: productPath(product.id),
    path: productPath(product.id),
    keywords: `${product.category} ${product.description}`,
  }));

  return [...pages, ...extras, ...products];
}

/**
 * Case-insensitive match on every word of the query. Label matches rank
 * above path/keyword-only matches; original order breaks ties.
 */
export function filterCommands(commands, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;

  return commands
    .map((command, index) => {
      const label = command.label.toLowerCase();
      const haystack = `${label} ${command.hint} ${command.keywords ?? ''}`.toLowerCase();
      if (!words.every((word) => haystack.includes(word))) return null;
      const labelHits = words.filter((word) => label.includes(word)).length;
      return { command, index, labelHits };
    })
    .filter(Boolean)
    .sort((a, b) => b.labelHits - a.labelHits || a.index - b.index)
    .map((entry) => entry.command);
}
