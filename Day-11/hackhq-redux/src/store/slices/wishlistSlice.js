import { createSelector, createSlice } from '@reduxjs/toolkit';
import { SWAG_PRODUCTS } from '../../data/products.js';
import {
  getWishlistProducts,
  toggleWishlistId,
  calculateWishlistTotal,
} from '../../lib/wishlist.js';
import { addItem } from './cartSlice.js';
import { notify } from './toastsSlice.js';

// Saved swag, stored as product ids. Persisted under 'hackhq_wishlist'.
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { ids: [] },
  reducers: {
    wishlistToggled(state, action) {
      state.ids = toggleWishlistId(state.ids, action.payload, SWAG_PRODUCTS);
    },
    wishlistRemoved(state, action) {
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    wishlistCleared(state) {
      state.ids = [];
    },
  },
});

export const { wishlistToggled, wishlistRemoved, wishlistCleared } = wishlistSlice.actions;

export const selectWishlistIds = (state) => state.wishlist.ids;
export const selectWishlistProducts = createSelector(selectWishlistIds, (ids) =>
  getWishlistProducts(ids, SWAG_PRODUCTS)
);
export const selectWishlistCount = createSelector(selectWishlistProducts, (items) => items.length);
export const selectWishlistTotal = createSelector(selectWishlistProducts, calculateWishlistTotal);
export const makeSelectIsWishlisted = (productId) => (state) =>
  state.wishlist.ids.includes(productId);

/**
 * Thunks coordinate two slices: wishlist and cart. A thunk can read state with getState and
 * dispatch several actions, which keeps "move to cart" as one unit of logic in one place.
 */
export const moveToCart = (productId) => (dispatch, getState) => {
  const product = SWAG_PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  const before = getState().cart.items.find((l) => l.productId === productId)?.quantity ?? 0;
  dispatch(addItem(productId));
  const after = getState().cart.items.find((l) => l.productId === productId)?.quantity ?? 0;
  if (after === before) {
    dispatch(notify(`${product.name} is already at the 10-per-item limit`, null, 'warn'));
    return;
  }
  dispatch(wishlistRemoved(productId));
  dispatch(notify(`Moved ${product.name} to cart`, null, 'success'));
};

export const moveAllToCart = () => (dispatch, getState) => {
  const ids = [...getState().wishlist.ids];
  let moved = 0;
  for (const id of ids) {
    const before = getState().cart.items.find((l) => l.productId === id)?.quantity ?? 0;
    dispatch(addItem(id));
    const after = getState().cart.items.find((l) => l.productId === id)?.quantity ?? 0;
    if (after > before) {
      dispatch(wishlistRemoved(id));
      moved += 1;
    }
  }
  const skipped = ids.length - moved;
  dispatch(
    notify(
      skipped ? `Moved ${moved} to cart, ${skipped} at the item limit` : `Moved ${moved} to cart`,
      null,
      skipped ? 'warn' : 'success'
    )
  );
};

export default wishlistSlice.reducer;
