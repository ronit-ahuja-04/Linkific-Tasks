import { createSelector, createSlice } from '@reduxjs/toolkit';

export const MAX_PER_ITEM = 10;

// The cart stores a small snapshot of each product (not the whole API object) plus a quantity.
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addToCart: {
      prepare: ({ id, title, price, thumbnail }) => ({ payload: { id, title, price, thumbnail } }),
      reducer(state, action) {
        const line = state.items.find((l) => l.id === action.payload.id);
        if (line) line.quantity = Math.min(line.quantity + 1, MAX_PER_ITEM);
        else state.items.push({ ...action.payload, quantity: 1 });
      },
    },
    increment(state, action) {
      const line = state.items.find((l) => l.id === action.payload);
      if (line) line.quantity = Math.min(line.quantity + 1, MAX_PER_ITEM);
    },
    decrement(state, action) {
      const line = state.items.find((l) => l.id === action.payload);
      if (!line) return;
      if (line.quantity <= 1) state.items = state.items.filter((l) => l.id !== action.payload);
      else line.quantity -= 1;
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((l) => l.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, increment, decrement, removeFromCart, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((sum, l) => sum + l.quantity, 0)
);
export const selectCartTotal = createSelector([selectCartItems], (items) =>
  Math.round(items.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100
);
export const makeSelectQuantity = (id) => (state) =>
  state.cart.items.find((l) => l.id === id)?.quantity ?? 0;
export default cartSlice.reducer;
