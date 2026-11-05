import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth from './slices/authSlice.js';
import todos from './slices/todosSlice.js';
import products from './slices/productsSlice.js';
import cart from './slices/cartSlice.js';
import { loadState, startPersisting } from './persist.js';

// Each key is one slice of the state tree: state.auth, state.todos, state.products, state.cart
export const rootReducer = combineReducers({ auth, todos, products, cart });

/** Factory so tests can create a fresh store; the app uses the `store` singleton below */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Redux DevTools: enabled outside production (inspect, diff, time travel, replay)
    devTools: import.meta.env?.PROD ? false : { name: 'Redux Market' },
  });
}

export const store = makeStore(typeof window === 'undefined' ? undefined : loadState());
if (typeof window !== 'undefined') startPersisting(store);
