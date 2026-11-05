import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { buildProductsUrl, getJson } from '../../lib/api.js';

/** Fetch the product list. `signal` lets the caller abort a request that is no longer needed. */
export const fetchProducts = createAsyncThunk('products/fetch', async (params, { signal }) =>
  getJson(buildProductsUrl(params), { signal })
);

const productsSlice = createSlice({
  name: 'products',
  initialState: { items: [], total: 0, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.products;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.meta.aborted) return; // superseded by a newer search, not an error
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const selectProducts = (state) => state.products.items;
export const selectProductsStatus = (state) => state.products.status;
export const selectProductsError = (state) => state.products.error;
export const selectProductsTotal = (state) => state.products.total;
export default productsSlice.reducer;
