/**
 * Sample product dataset for DevHub developer store & tools.
 * Proves complex props: nested objects, number types, and string arrays (tags).
 */
export const products = [
  {
    id: 'prod-001',
    name: 'React 19 Architecture Starter Kit',
    category: 'Templates',
    price: 49,
    rating: 4.9,
    inStock: true,
    tags: ['React 19', 'Vite', 'Design System'],
    description: 'Battle-tested production scaffolding featuring modern state, async actions, and strict linting.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod-002',
    name: 'Mechanical Ergonomic Dev Keyboard',
    category: 'Hardware',
    price: 189,
    rating: 4.8,
    inStock: true,
    tags: ['Hardware', 'Ergonomics', 'USB-C'],
    description: 'Split mechanical keyboard with hot-swappable tactile silent switches for long coding sessions.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod-003',
    name: 'TypeScript Mastery Deep-Dive Handbook',
    category: 'Books',
    price: 35,
    rating: 4.95,
    inStock: false,
    tags: ['TypeScript', 'E-Book', 'Advanced'],
    description: 'From conditional types to template literal inference. Hardcover edition currently backordered.',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod-004',
    name: 'DevHub Clean Theme & Icon Pack',
    category: 'Assets',
    price: 24,
    rating: 4.7,
    inStock: true,
    tags: ['SVG', 'Icons', 'Figma', 'Dark Mode'],
    description: 'Over 850+ hand-crafted vector icons optimized for dark UI themes and developer tools.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod-005',
    name: 'Ultra-Wide 4K HDR Developer Monitor',
    category: 'Hardware',
    price: 649,
    rating: 4.6,
    inStock: false,
    tags: ['Hardware', '4K', 'USB-C Hub'],
    description: '38-inch curved IPS panel with built-in KVM switch and 96W USB-C power delivery.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod-006',
    name: 'Full-Stack Performance Auditing Course',
    category: 'Education',
    price: 99,
    rating: 5.0,
    inStock: true,
    tags: ['Performance', 'Lighthouse', 'V8 Engine'],
    description: 'Complete video course covering Core Web Vitals, memory leak profiling, and bundle analysis.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80',
  },
];

export default products;
