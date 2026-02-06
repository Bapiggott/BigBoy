/**
 * App configuration
 * NOTE: Use Expo public env vars for runtime configuration.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.112.1:3001/api';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
