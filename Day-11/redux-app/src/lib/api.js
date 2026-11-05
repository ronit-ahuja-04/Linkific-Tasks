// DummyJSON is a free fake REST API: https://dummyjson.com/docs
export const API = 'https://dummyjson.com';

export const buildProductsUrl = ({ query = '', limit = 12 } = {}) => {
  const q = query.trim();
  return q
    ? `${API}/products/search?q=${encodeURIComponent(q)}&limit=${limit}`
    : `${API}/products?limit=${limit}`;
};

/** fetch + JSON with a readable error for non-2xx responses */
export async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
  }
  return response.json();
}

export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
