import { apiClient } from '../client';
import { LoginRequest, LoginResponse, RegisterRequest } from '../types';
import { User } from '../../types';

/**
 * Auth API Endpoints
 * Currently returns mock data - swap implementation when backend is ready
 */

// Mock implementation flag - set to false when backend is ready
const USE_MOCK = true;

/**
 * Login user
 */
export const login = async (credentials: LoginRequest): Promise<{ token: string; user: User } | null> => {
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock successful login
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'user-001',
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        phone: '(248) 555-1234',
        loyaltyStatus: {
          currentPoints: 785,
          lifetimePoints: 1785,
          tier: 'silver',
          pointsToNextTier: 715,
          memberSince: '2022-03-15',
        },
        createdAt: '2022-03-15T10:00:00Z',
      },
    };
  }

  const response = await apiClient.post<LoginResponse>('/auth/login', credentials, {
    requiresAuth: false,
  });

  if (response.success && response.data) {
    return {
      token: response.data.token,
      user: {
        ...response.data.user,
        loyaltyStatus: {
          currentPoints: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          memberSince: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  return null;
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<{ token: string; user: User } | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      token: 'mock-jwt-token-new-user',
      user: {
        id: 'user-new',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthday: data.birthday,
        loyaltyStatus: {
          currentPoints: 100, // Welcome bonus
          lifetimePoints: 100,
          tier: 'bronze',
          pointsToNextTier: 900,
          memberSince: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  const response = await apiClient.post<LoginResponse>('/auth/register', data, {
    requiresAuth: false,
  });

  if (response.success && response.data) {
    return {
      token: response.data.token,
      user: {
        ...response.data.user,
        phone: data.phone,
        birthday: data.birthday,
        loyaltyStatus: {
          currentPoints: 100,
          lifetimePoints: 100,
          tier: 'bronze',
          pointsToNextTier: 900,
          memberSince: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  return null;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: 'user-001',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '(248) 555-1234',
      birthday: '1985-06-15',
      loyaltyStatus: {
        currentPoints: 785,
        lifetimePoints: 1785,
        tier: 'silver',
        pointsToNextTier: 715,
        memberSince: '2022-03-15',
      },
      createdAt: '2022-03-15T10:00:00Z',
    };
  }

  const response = await apiClient.get<User>('/auth/me');
  return response.success ? response.data ?? null : null;
};

/**
 * Logout user
 */
export const logout = async (): Promise<boolean> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  }

  const response = await apiClient.post('/auth/logout');
  return response.success;
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  const response = await apiClient.post('/auth/forgot-password', { email }, {
    requiresAuth: false,
  });
  return response.success;
};
