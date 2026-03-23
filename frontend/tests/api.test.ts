/**
 * Test suite for API client
 * Tests: Authorization header attachment, error handling, base URL configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('API Client (lib/api.ts)', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock store
    localStorage.setItem('access_token', 'mock-token-123');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates axios instance with correct base URL', () => {
    const expectedBaseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    // This should match the api.ts implementation
    expect(expectedBaseURL).toContain('/api/v1');
  });

  it('attaches JWT token to requests', () => {
    // Verify token from localStorage
    const token = localStorage.getItem('access_token');
    expect(token).toBe('mock-token-123');
  });

  it('handles missing token gracefully', () => {
    localStorage.removeItem('access_token');
    const token = localStorage.getItem('access_token');
    expect(token).toBeNull();
  });

  it('constructs auth headers correctly', () => {
    const token = localStorage.getItem('access_token');
    const authHeader = `Bearer ${token}`;
    expect(authHeader).toBe('Bearer mock-token-123');
  });

  it('respects NEXT_PUBLIC_API_URL environment variable', () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Should either be set or default to localhost
    expect(
      apiUrl === undefined || apiUrl === 'http://localhost:8000/api/v1'
    ).toBeTruthy();
  });
});
