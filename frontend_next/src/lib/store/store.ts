import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice';
import reservationsReducer from './slices/reservationsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      events: eventsReducer,
      reservations: reservationsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['events/setEvents', 'reservations/setReservations'],
        },
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
