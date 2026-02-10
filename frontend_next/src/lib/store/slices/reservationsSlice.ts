import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Reservation, ReservationStatus } from '@/types/api.types';

interface ReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: ReservationStatus;
    eventId?: string;
  };
}

const initialState: ReservationsState = {
  reservations: [],
  selectedReservation: null,
  isLoading: false,
  error: null,
  filters: {},
};

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    setReservations: (state, action: PayloadAction<Reservation[]>) => {
      state.reservations = action.payload;
      state.error = null;
    },
    addReservation: (state, action: PayloadAction<Reservation>) => {
      state.reservations.unshift(action.payload);
    },
    updateReservation: (state, action: PayloadAction<Reservation>) => {
      const index = state.reservations.findIndex(
        (r) => r._id === action.payload._id
      );
      if (index !== -1) {
        state.reservations[index] = action.payload;
      }
      if (state.selectedReservation?._id === action.payload._id) {
        state.selectedReservation = action.payload;
      }
    },
    removeReservation: (state, action: PayloadAction<string>) => {
      state.reservations = state.reservations.filter(
        (r) => r._id !== action.payload
      );
      if (state.selectedReservation?._id === action.payload) {
        state.selectedReservation = null;
      }
    },
    setSelectedReservation: (state, action: PayloadAction<Reservation | null>) => {
      state.selectedReservation = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (
      state,
      action: PayloadAction<{ status?: ReservationStatus; eventId?: string }>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setReservations,
  addReservation,
  updateReservation,
  removeReservation,
  setSelectedReservation,
  setLoading,
  setError,
  clearError,
  setFilters,
  clearFilters,
} = reservationsSlice.actions;

export default reservationsSlice.reducer;
