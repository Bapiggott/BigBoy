import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@bigboy/auth_token',
  USER: '@bigboy/user',
  USER_PREFERENCES: '@bigboy/user_preferences',
  CART: '@bigboy/cart',
  SELECTED_LOCATION: '@bigboy/selected_location',
  ONBOARDING_COMPLETE: '@bigboy/onboarding_complete',
  CACHED_MENU: '@bigboy/cached_menu',
  CACHED_LOCATIONS: '@bigboy/cached_locations',
  CACHED_REWARDS: '@bigboy/cached_rewards',
  LAST_SYNC: '@bigboy/last_sync',
  REWARD_POINTS: 'bb_points',
  REWARD_REDEMPTIONS: 'bb_redeemed_rewards',
  APPLIED_REWARD_ID: 'bb_applied_reward_id',
  REWARD_COUPONS: 'bb_reward_coupons',
  APPLIED_COUPON_ID: 'bb_applied_coupon_id',
} as const;

/**
 * Generic Storage Operations
 */
export const storage = {
  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all app storage
   */
  async clear(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  /**
   * Get multiple values at once
   */
  async getMultiple<T extends Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Partial<T> = {};
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            (result as Record<string, unknown>)[key] = JSON.parse(value);
          } catch {
            (result as Record<string, unknown>)[key] = value;
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  },
};

/**
 * App-Specific Storage Operations
 * Typed convenience methods for common operations
 */
export const appStorage = {
  // Auth token
  async getAuthToken(): Promise<string | null> {
    return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<boolean> {
    return storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async clearAuthToken(): Promise<boolean> {
    return storage.remove(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Selected location
  async getSelectedLocation(): Promise<string | null> {
    return storage.get<string>(STORAGE_KEYS.SELECTED_LOCATION);
  },

  async setSelectedLocation(locationId: string): Promise<boolean> {
    return storage.set(STORAGE_KEYS.SELECTED_LOCATION, locationId);
  },

  // Onboarding
  async isOnboardingComplete(): Promise<boolean> {
    const value = await storage.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === true;
  },

  async setOnboardingComplete(): Promise<boolean> {
    return storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
  },

  // Cache operations with timestamps
  async getCachedData<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    return storage.get<{ data: T; timestamp: number }>(key);
  },

  async setCachedData<T>(key: string, data: T): Promise<boolean> {
    return storage.set(key, { data, timestamp: Date.now() });
  },

  // Check if cache is stale (default: 1 hour)
  async isCacheStale(key: string, maxAgeMs: number = 60 * 60 * 1000): Promise<boolean> {
    const cached = await storage.get<{ timestamp: number }>(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > maxAgeMs;
  },
};
