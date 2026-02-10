import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Event, EventStatus } from '@/types/api.types';

interface EventsState {
  events: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: EventStatus;
    searchQuery?: string;
  };
}

const initialState: EventsState = {
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,
  filters: {},
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload;
      state.error = null;
    },
    addEvent: (state, action: PayloadAction<Event>) => {
      state.events.unshift(action.payload);
    },
    updateEvent: (state, action: PayloadAction<Event>) => {
      const index = state.events.findIndex((e) => e._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      if (state.selectedEvent?._id === action.payload._id) {
        state.selectedEvent = action.payload;
      }
    },
    removeEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e._id !== action.payload);
      if (state.selectedEvent?._id === action.payload) {
        state.selectedEvent = null;
      }
    },
    setSelectedEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload;
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
      action: PayloadAction<{ status?: EventStatus; searchQuery?: string }>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  setSelectedEvent,
  setLoading,
  setError,
  clearError,
  setFilters,
  clearFilters,
} = eventsSlice.actions;

export default eventsSlice.reducer;
