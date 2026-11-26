import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../lib/api/authApi';
import { fetchPublishedRealms } from '../../lib/api/catalogApi';
import type { ApiError, CourseLevel, CourseRealm, SkillTag } from '../../types/lms';

export type CatalogSort = 'xp' | 'rating' | 'newest';

export interface CatalogFilters {
  query: string;
  category: string;
  level: 'all' | CourseLevel;
  skillTag: 'all' | SkillTag;
  sort: CatalogSort;
}

export interface CatalogState {
  realms: CourseRealm[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
  filters: CatalogFilters;
}

const initialState: CatalogState = {
  realms: [],
  status: 'idle',
  error: null,
  filters: {
    query: '',
    category: 'all',
    level: 'all',
    skillTag: 'all',
    sort: 'xp',
  },
};

export const fetchRealms = createAsyncThunk<CourseRealm[], void, { rejectValue: ApiError }>(
  'catalog/fetchRealms',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPublishedRealms();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Could not load realms'));
    }
  },
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setCatalogQuery(state, action: PayloadAction<string>) {
      state.filters.query = action.payload;
    },
    setCatalogCategory(state, action: PayloadAction<string>) {
      state.filters.category = action.payload;
    },
    setCatalogLevel(state, action: PayloadAction<'all' | CourseLevel>) {
      state.filters.level = action.payload;
    },
    setCatalogSkillTag(state, action: PayloadAction<'all' | SkillTag>) {
      state.filters.skillTag = action.payload;
    },
    setCatalogSort(state, action: PayloadAction<CatalogSort>) {
      state.filters.sort = action.payload;
    },
    resetCatalogFilters(state) {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRealms.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRealms.fulfilled, (state, action) => {
        state.realms = action.payload;
        state.status = 'ready';
      })
      .addCase(fetchRealms.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? {
          code: 'catalog_error',
          message: 'Failed to load catalog',
        };
      });
  },
});

export const {
  setCatalogQuery,
  setCatalogCategory,
  setCatalogLevel,
  setCatalogSkillTag,
  setCatalogSort,
  resetCatalogFilters,
} = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
