import { apiClient } from '../client';
import { MenuCategory, MenuItem } from '../../types';
import { mockCategories, mockMenuItems } from '../../data/mockMenu';
import { API_BASE_URL, USE_MOCK } from '../../config';

/**
 * Menu API Endpoints
 * API-first with safe mock fallback.
 */

apiClient.setBaseUrl(API_BASE_URL);

const withApiFallback = async <T>(
  label: string,
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>
): Promise<T> => {
  if (USE_MOCK) {
    return mockCall();
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn(`[Menu API] ${label} failed, using mock data.`, error);
    return mockCall();
  }
};

/**
 * Get all menu categories
 */
export const getCategories = async (): Promise<MenuCategory[]> => {
  return withApiFallback(
    'getCategories',
    async () => {
      const response = await apiClient.get<{ categories: MenuCategory[] }>('/menu/categories');
      if (response.success && response.data?.categories) {
        return response.data.categories;
      }
      throw new Error(response.error ?? 'Failed to fetch categories');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCategories;
    }
  );
};

/**
 * Get all menu items
 */
export const getMenuItems = async (): Promise<MenuItem[]> => {
  return withApiFallback(
    'getMenuItems',
    async () => {
      const response = await apiClient.get<{ items: MenuItem[] }>('/menu/items');
      if (response.success && response.data?.items) {
        return response.data.items;
      }
      throw new Error(response.error ?? 'Failed to fetch menu items');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockMenuItems;
    }
  );
};

/**
 * Get menu items by category
 */
export const getMenuItemsByCategory = async (categoryId: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'getMenuItemsByCategory',
    async () => {
      const response = await apiClient.get<{ items: MenuItem[] }>(
        `/menu/items?category=${encodeURIComponent(categoryId)}`
      );
      if (response.success && response.data?.items) {
        return response.data.items;
      }
      throw new Error(response.error ?? 'Failed to fetch menu items by category');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockMenuItems.filter(item => item.categoryId === categoryId);
    }
  );
};

/**
 * Get a single menu item by ID
 */
export const getMenuItem = async (itemId: string): Promise<MenuItem | null> => {
  return withApiFallback(
    'getMenuItem',
    async () => {
      const response = await apiClient.get<{ item: MenuItem }>(`/menu/items/${itemId}`);
      if (response.success && response.data?.item) {
        return response.data.item;
      }
      throw new Error(response.error ?? 'Failed to fetch menu item');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockMenuItems.find(item => item.id === itemId) ?? null;
    }
  );
};

/**
 * Get popular/featured menu items
 */
export const getPopularItems = async (): Promise<MenuItem[]> => {
  return withApiFallback(
    'getPopularItems',
    async () => {
      const response = await apiClient.get<{ items: MenuItem[] }>('/menu/items?popular=true');
      if (response.success && response.data?.items) {
        return response.data.items;
      }
      throw new Error(response.error ?? 'Failed to fetch popular items');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockMenuItems.filter(item => item.isPopular);
    }
  );
};

/**
 * Get new menu items
 */
export const getNewItems = async (): Promise<MenuItem[]> => {
  return withApiFallback(
    'getNewItems',
    async () => {
      const response = await apiClient.get<{ new: MenuItem[] }>('/menu/featured');
      if (response.success && response.data?.new) {
        return response.data.new;
      }
      throw new Error(response.error ?? 'Failed to fetch new items');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockMenuItems.filter(item => item.isNew);
    }
  );
};

/**
 * Search menu items
 */
export const searchMenuItems = async (query: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'searchMenuItems',
    async () => {
      const response = await apiClient.get<{ items: MenuItem[] }>(
        `/menu/items?search=${encodeURIComponent(query)}`
      );
      if (response.success && response.data?.items) {
        return response.data.items;
      }
      throw new Error(response.error ?? 'Failed to search menu items');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const lowerQuery = query.toLowerCase();
      return mockMenuItems.filter(
        item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
      );
    }
  );
};

/**
 * Get menu availability for a specific location
 */
export const getMenuForLocation = async (locationId: string): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> => {
  return withApiFallback(
    'getMenuForLocation',
    async () => {
      const response = await apiClient.get<{ categories: MenuCategory[]; items: MenuItem[] }>(
        `/menu?locationId=${encodeURIComponent(locationId)}`
      );
      if (response.success && response.data?.categories && response.data?.items) {
        return response.data;
      }
      throw new Error(response.error ?? 'Failed to fetch menu for location');
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      // In production, some items might not be available at certain locations
      return {
        categories: mockCategories,
        items: mockMenuItems,
      };
    }
  );
};
