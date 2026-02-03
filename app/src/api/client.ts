import { appStorage } from '../utils/storage';
import { ApiResponse } from '../types';

/**
 * API Configuration
 * Change BASE_URL when connecting to real backend
 */
const API_CONFIG = {
  // For local development with server running
  BASE_URL: 'http://localhost:3001/api',
  // For production, this would be your actual API URL
  // BASE_URL: 'https://api.bigboy.com/v1',
  TIMEOUT: 10000,
};

/**
 * HTTP Methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request options
 */
interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * API Client
 * Centralized HTTP client for all API calls
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Update base URL (for switching environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await appStorage.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Build request config
    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      // Handle network errors, timeouts, etc.
      const message =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Request timeout'
            : error.message
          : 'Network error';

      return {
        success: false,
        error: message,
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

// Export class for testing/mocking
export { ApiClient };
