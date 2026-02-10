export { makeStore } from './store';
export type { AppStore, RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector, useAppStore } from './hooks';
export { default as StoreProvider } from './StoreProvider';

import * as authSlice from './slices/authSlice';
import * as eventsSlice from './slices/eventsSlice';
import * as reservationsSlice from './slices/reservationsSlice';

export const authActions = authSlice;
export const eventsActions = eventsSlice;
export const reservationsActions = reservationsSlice;
