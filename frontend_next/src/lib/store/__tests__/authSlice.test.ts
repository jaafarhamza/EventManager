import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setUser, clearUser, setLoading } from '../slices/authSlice';
import type { User, UserRole } from '@/types/api.types';
import type { RootState } from '../store';

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  it('should have initial state', () => {
    const state = (store.getState() as RootState).auth;
    expect(state).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should handle setUser', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PARTICIPANT' as UserRole,
    };

    store.dispatch(setUser(mockUser));

    const state = (store.getState() as RootState).auth;
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle clearUser', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PARTICIPANT' as UserRole,
    };

    // First set a user
    store.dispatch(setUser(mockUser));
    expect((store.getState() as RootState).auth.isAuthenticated).toBe(true);

    // Then clear
    store.dispatch(clearUser());

    const state = (store.getState() as RootState).auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should handle setLoading', () => {
    store.dispatch(setLoading(true));
    expect((store.getState() as RootState).auth.isLoading).toBe(true);

    store.dispatch(setLoading(false));
    expect((store.getState() as RootState).auth.isLoading).toBe(false);
  });

  it('should handle admin user', () => {
    const adminUser: User = {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as UserRole,
    };

    store.dispatch(setUser(adminUser));

    const state = (store.getState() as RootState).auth;
    expect(state.user?.role).toBe('ADMIN');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should preserve user data when setting loading', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PARTICIPANT' as UserRole,
    };

    store.dispatch(setUser(mockUser));
    store.dispatch(setLoading(true));

    const state = (store.getState() as RootState).auth;
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(true);
  });
});
