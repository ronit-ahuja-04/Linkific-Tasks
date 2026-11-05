import { describe, it, expect } from 'vitest';
import { makeStore } from '../src/store/index.js';
import { SWAG_PRODUCTS } from '../src/data/products.js';
import {
  calculateWishlistTotal,
  getWishlistProducts,
  splitByCartCapacity,
  toggleWishlistId,
} from '../src/lib/wishlist.js';
import {
  makeSelectIsWishlisted,
  moveAllToCart,
  moveToCart,
  selectWishlistCount,
  selectWishlistIds,
  selectWishlistProducts,
  selectWishlistTotal,
  wishlistCleared,
  wishlistRemoved,
  wishlistToggled,
} from '../src/store/slices/wishlistSlice.js';
import { addItem, selectCartItems } from '../src/store/slices/cartSlice.js';
import { selectToasts } from '../src/store/slices/toastsSlice.js';

const [a, b, c] = SWAG_PRODUCTS;

describe('wishlist pure logic (src/lib/wishlist.js)', () => {
  it('toggles an id in and out', () => {
    const added = toggleWishlistId([], a.id, SWAG_PRODUCTS);
    expect(added).toEqual([a.id]);
    expect(toggleWishlistId(added, a.id, SWAG_PRODUCTS)).toEqual([]);
  });

  it('keeps saved order and does not mutate the input', () => {
    const ids = [a.id];
    const next = toggleWishlistId(ids, b.id, SWAG_PRODUCTS);
    expect(next).toEqual([a.id, b.id]);
    expect(ids).toEqual([a.id]);
  });

  it('rejects unknown product ids and tolerates a bad list', () => {
    expect(toggleWishlistId([], 'nope', SWAG_PRODUCTS)).toEqual([]);
    expect(toggleWishlistId(null, a.id, SWAG_PRODUCTS)).toEqual([a.id]);
  });

  it('resolves products in saved order and skips stale ids', () => {
    expect(getWishlistProducts([b.id, 'gone', a.id], SWAG_PRODUCTS)).toEqual([b, a]);
    expect(getWishlistProducts(undefined, SWAG_PRODUCTS)).toEqual([]);
  });

  it('totals the price of the saved products', () => {
    expect(calculateWishlistTotal([a, b])).toBe(a.price + b.price);
    expect(calculateWishlistTotal([])).toBe(0);
  });

  it('splits items by cart capacity (10 per item)', () => {
    const cart = [
      { productId: a.id, quantity: 10 },
      { productId: b.id, quantity: 3 },
    ];
    const { addable, blocked } = splitByCartCapacity([a, b, c], cart);
    expect(blocked).toEqual([a]);
    expect(addable).toEqual([b, c]);
  });
});

describe('wishlist slice', () => {
  it('toggles, removes and clears', () => {
    const store = makeStore();
    store.dispatch(wishlistToggled(a.id));
    store.dispatch(wishlistToggled(b.id));
    expect(selectWishlistIds(store.getState())).toEqual([a.id, b.id]);
    expect(makeSelectIsWishlisted(a.id)(store.getState())).toBe(true);
    store.dispatch(wishlistToggled(a.id));
    expect(makeSelectIsWishlisted(a.id)(store.getState())).toBe(false);
    store.dispatch(wishlistRemoved(b.id));
    expect(selectWishlistCount(store.getState())).toBe(0);
    store.dispatch(wishlistToggled(c.id));
    store.dispatch(wishlistCleared());
    expect(selectWishlistIds(store.getState())).toEqual([]);
  });

  it('derives products, count and total with memoized selectors', () => {
    const store = makeStore();
    store.dispatch(wishlistToggled(a.id));
    store.dispatch(wishlistToggled(b.id));
    const first = selectWishlistProducts(store.getState());
    expect(first).toEqual([a, b]);
    expect(selectWishlistProducts(store.getState())).toBe(first);
    expect(selectWishlistTotal(store.getState())).toBe(a.price + b.price);
  });
});

describe('moveToCart and moveAllToCart thunks (wishlist + cart + toasts)', () => {
  it('moves one product: added to the cart, removed from the wishlist, toast shown', () => {
    const store = makeStore();
    store.dispatch(wishlistToggled(a.id));
    store.dispatch(moveToCart(a.id));
    expect(selectCartItems(store.getState())).toEqual([{ productId: a.id, quantity: 1 }]);
    expect(selectWishlistIds(store.getState())).toEqual([]);
    expect(selectToasts(store.getState())[0].type).toBe('success');
  });

  it('keeps the item saved when the cart line is already at the limit', () => {
    const store = makeStore();
    for (let i = 0; i < 10; i++) store.dispatch(addItem(a.id));
    store.dispatch(wishlistToggled(a.id));
    store.dispatch(moveToCart(a.id));
    expect(selectCartItems(store.getState())[0].quantity).toBe(10);
    expect(selectWishlistIds(store.getState())).toEqual([a.id]);
    expect(selectToasts(store.getState())[0].type).toBe('warn');
  });

  it('moves everything, leaving only items that hit the limit', () => {
    const store = makeStore();
    for (let i = 0; i < 10; i++) store.dispatch(addItem(a.id));
    [a.id, b.id, c.id].forEach((id) => store.dispatch(wishlistToggled(id)));
    store.dispatch(moveAllToCart());
    expect(selectWishlistIds(store.getState())).toEqual([a.id]);
    const items = selectCartItems(store.getState());
    expect(items.find((l) => l.productId === b.id).quantity).toBe(1);
    expect(items.find((l) => l.productId === c.id).quantity).toBe(1);
  });

  it('ignores unknown product ids', () => {
    const store = makeStore();
    store.dispatch(moveToCart('nope'));
    expect(selectCartItems(store.getState())).toEqual([]);
  });
});
