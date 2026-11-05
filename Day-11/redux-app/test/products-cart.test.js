import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../src/store/index.js';
import { buildProductsUrl } from '../src/lib/api.js';
import {
  fetchProducts, selectProducts, selectProductsError, selectProductsStatus, selectProductsTotal,
} from '../src/store/slices/productsSlice.js';
import {
  addToCart, clearCart, decrement, increment, makeSelectQuantity, MAX_PER_ITEM, removeFromCart,
  selectCartCount, selectCartItems, selectCartTotal,
} from '../src/store/slices/cartSlice.js';
import { mockFetch } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const P1 = { id: 1, title: 'Phone', price: 100, thumbnail: 'p.png', category: 'x', rating: 4, description: 'long text' };
const P2 = { id: 2, title: 'Case', price: 9.99, thumbnail: 'c.png' };

describe('products slice (async thunk)', () => {
  it('builds list and search URLs', () => {
    expect(buildProductsUrl({ limit: 12 })).toBe('https://dummyjson.com/products?limit=12');
    expect(buildProductsUrl({ query: ' phone case ', limit: 5 })).toBe('https://dummyjson.com/products/search?q=phone%20case&limit=5');
  });

  it('goes idle -> loading -> succeeded', async () => {
    mockFetch({ json: { products: [P1, P2], total: 100 } });
    const store = makeStore();
    expect(selectProductsStatus(store.getState())).toBe('idle');
    const promise = store.dispatch(fetchProducts({ limit: 12 }));
    expect(selectProductsStatus(store.getState())).toBe('loading');
    await promise;
    expect(selectProductsStatus(store.getState())).toBe('succeeded');
    expect(selectProducts(store.getState())).toHaveLength(2);
    expect(selectProductsTotal(store.getState())).toBe(100);
  });

  it('records an HTTP failure and can recover on retry', async () => {
    mockFetch({ ok: false, status: 503, statusText: 'Unavailable' });
    const store = makeStore();
    await store.dispatch(fetchProducts({}));
    expect(selectProductsStatus(store.getState())).toBe('failed');
    expect(selectProductsError(store.getState())).toContain('503');

    mockFetch({ json: { products: [P1], total: 1 } });
    await store.dispatch(fetchProducts({}));
    expect(selectProductsStatus(store.getState())).toBe('succeeded');
    expect(selectProductsError(store.getState())).toBeNull();
  });

  it('does not treat an aborted request as an error', async () => {
    vi.stubGlobal('fetch', vi.fn((_u, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const store = makeStore();
    const request = store.dispatch(fetchProducts({ query: 'a' }));
    request.abort();
    await request;
    expect(selectProductsStatus(store.getState())).toBe('loading');
    expect(selectProductsError(store.getState())).toBeNull();
  });
});

describe('cart slice', () => {
  it('stores a small snapshot of the product, not the whole API object', () => {
    const store = makeStore();
    store.dispatch(addToCart(P1));
    expect(selectCartItems(store.getState())).toEqual([{ id: 1, title: 'Phone', price: 100, thumbnail: 'p.png', quantity: 1 }]);
  });

  it('increments an existing line instead of duplicating it', () => {
    const store = makeStore();
    store.dispatch(addToCart(P1));
    store.dispatch(addToCart(P1));
    store.dispatch(addToCart(P2));
    expect(selectCartItems(store.getState())).toHaveLength(2);
    expect(selectCartCount(store.getState())).toBe(3);
    expect(makeSelectQuantity(1)(store.getState())).toBe(2);
    expect(makeSelectQuantity(99)(store.getState())).toBe(0);
  });

  it('caps a line at 10', () => {
    const store = makeStore();
    for (let i = 0; i < 15; i++) store.dispatch(addToCart(P1));
    expect(makeSelectQuantity(1)(store.getState())).toBe(MAX_PER_ITEM);
    store.dispatch(increment(1));
    expect(makeSelectQuantity(1)(store.getState())).toBe(MAX_PER_ITEM);
  });

  it('decrements, and removes the line when it reaches zero', () => {
    const store = makeStore();
    store.dispatch(addToCart(P1));
    store.dispatch(increment(1));
    store.dispatch(decrement(1));
    expect(makeSelectQuantity(1)(store.getState())).toBe(1);
    store.dispatch(decrement(1));
    expect(selectCartItems(store.getState())).toEqual([]);
    store.dispatch(decrement(1)); // no-op on a missing line
    expect(selectCartItems(store.getState())).toEqual([]);
  });

  it('removes lines, clears, and totals without floating-point noise', () => {
    const store = makeStore();
    store.dispatch(addToCart(P1));
    store.dispatch(addToCart(P2));
    store.dispatch(addToCart(P2));
    expect(selectCartTotal(store.getState())).toBe(119.98);
    store.dispatch(removeFromCart(1));
    expect(selectCartTotal(store.getState())).toBe(19.98);
    store.dispatch(clearCart());
    expect(selectCartCount(store.getState())).toBe(0);
    expect(selectCartTotal(store.getState())).toBe(0);
  });
});
