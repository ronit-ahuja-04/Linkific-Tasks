import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  addToCart,
  calculateSubtotal,
  calculateTotalItemCount,
  removeFromCart,
  updateCartQuantity,
} from '../../lib/cart.js';
import { SWAG_PRODUCTS } from '../../data/products.js';

// Reducers reuse the pure functions from Day 6: Redux Toolkit only changes where the state lives.
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addItem(state, action) {
      state.items = addToCart(state.items, action.payload);
    },
    changeQuantity(state, action) {
      const { productId, delta } = action.payload;
      state.items = updateCartQuantity(state.items, productId, delta);
    },
    removeItem(state, action) {
      state.items = removeFromCart(state.items, action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, changeQuantity, removeItem, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = createSelector(selectCartItems, calculateTotalItemCount);
export const selectCartSubtotal = createSelector(selectCartItems, (items) =>
  calculateSubtotal(items, SWAG_PRODUCTS)
);
export const makeSelectQuantity = (productId) => (state) =>
  state.cart.items.find((line) => line.productId === productId)?.quantity ?? 0;
export default cartSlice.reducer;
