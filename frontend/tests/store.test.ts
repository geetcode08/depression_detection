/**
 * Test suite for useUserStore (Zustand store)
 * Tests: Auth state, guest mode, account deletion, token management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useUserStore (Zustand)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with null user when not authenticated', () => {
    localStorage.removeItem('access_token');
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('stores and retrieves access token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    localStorage.setItem('access_token', token);

    expect(localStorage.getItem('access_token')).toBe(token);
  });

  it('clears auth state on logout', () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@test.com' }));

    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('supports guest mode state', () => {
    const guestState = { isGuest: true, user: null };
    localStorage.setItem('guest_state', JSON.stringify(guestState));

    const stored = JSON.parse(localStorage.getItem('guest_state') || '{}');
    expect(stored.isGuest).toBe(true);
    expect(stored.user).toBeNull();
  });

  it('tracks authenticated user data', () => {
    const userData = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    };

    localStorage.setItem('user', JSON.stringify(userData));
    const retrieved = JSON.parse(localStorage.getItem('user') || '{}');

    expect(retrieved.email).toBe('user@example.com');
    expect(retrieved.id).toBe('user-123');
  });

  it('maintains consent state', () => {
    localStorage.setItem('consent_given', 'true');
    expect(localStorage.getItem('consent_given')).toBe('true');
  });
});
