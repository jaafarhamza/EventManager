import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/slices/authSlice';
import eventsReducer from '@/lib/store/slices/eventsSlice';
import reservationsReducer from '@/lib/store/slices/reservationsSlice';

/**
 * Create a mock Redux store for testing
 */
export function createMockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      events: eventsReducer,
      reservations: reservationsReducer,
    },
    preloadedState,
  });
}

/**
 * Custom render function that includes Redux Provider
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<ReturnType<typeof createMockStore>['getState']>;
  store?: ReturnType<typeof createMockStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  participant: {
    id: '1',
    email: 'participant@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PARTICIPANT' as const,
  },
  admin: {
    id: '2',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
  },
};

/**
 * Mock event data for testing
 */
export const mockEvent = {
  _id: '1',
  title: 'Test Event',
  description: 'Test Description',
  date: '2026-03-01T14:00:00.000Z',
  location: 'Paris',
  capacity: 50,
  availableSeats: 30,
  status: 'PUBLISHED' as const,
  createdBy: 'user123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock reservation data for testing
 */
export const mockReservation = {
  _id: '1',
  status: 'CONFIRMED' as const,
  eventId: mockEvent,
  userId: mockUser.participant,
  canceledAt: null,
  cancelReason: null,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

/**
 * Wait for async operations to complete
 */
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
