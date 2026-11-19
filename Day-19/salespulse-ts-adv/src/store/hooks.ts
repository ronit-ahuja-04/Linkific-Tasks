import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';

/**
 * Pre-typed hooks. Plain `useSelector((state) => ...)` gives `state` the type `unknown`, and plain `useDispatch()`
 * does not know about thunks. `.withTypes<...>()` bakes our types in once, so every component just calls
 * `useAppSelector` / `useAppDispatch` and gets full checking with no annotations.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
