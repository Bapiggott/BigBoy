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

/**
 * Google Sign-In
 * Sends the Google ID token to the backend for verification
 */
export const googleLogin = async (idToken: string): Promise<{ token: string; user: User } | null> => {
  console.log('[AuthAPI] Google login with ID token');

  if (USE_MOCK) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, the backend would:
    // 1. Verify the ID token with Google
    // 2. Extract user info (email, name, etc.)
    // 3. Create or find the user in the database
    // 4. Return a JWT token

    // For mock, we'll decode the token payload (middle part of JWT)
    // to get user info, or use fake data
    let email = 'google.user@gmail.com';
    let firstName = 'Google';
    let lastName = 'User';

    try {
      // Try to decode the Google ID token to get real user info
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        email = payload.email || email;
        firstName = payload.given_name || firstName;
        lastName = payload.family_name || lastName;
        console.log('[AuthAPI] Decoded Google token:', { email, firstName, lastName });
      }
    } catch (e) {
      console.log('[AuthAPI] Could not decode token, using mock data');
    }

    return {
      token: 'mock-jwt-token-google-user',
      user: {
        id: 'user-google',
        email,
        firstName,
        lastName,
        loyaltyStatus: {
          currentPoints: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          pointsToNextTier: 1000,
          memberSince: new Date().toISOString().split('T')[0],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  const response = await apiClient.post<{ token: string; user: User }>('/auth/google', { idToken }, {
    requiresAuth: false,
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * Google Sign-In with auth code + PKCE
 */
export const googleLoginWithAuthCode = async (payload: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ token: string; user: User } | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      token: 'mock-jwt-token-google-user',
      user: {
        id: 'user-google',
        email: 'google.user@gmail.com',
        firstName: 'Google',
        lastName: 'User',
        loyaltyStatus: {
          currentPoints: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          pointsToNextTier: 1000,
          memberSince: new Date().toISOString().split('T')[0],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  const response = await apiClient.post<{ token: string; user: User }>('/auth/google', payload, {
    requiresAuth: false,
  });

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};
