import { apiClient } from '../client';
import { MenuCategory, MenuItem } from '../../types';
import { mockCategories, mockMenuItems } from '../../data/mockMenu';
import { USE_MOCK } from '../../config';

/**
 * Menu API Endpoints
 * API-first with safe mock fallback.
 */

type MenuSource = 'api' | 'mock';
let lastMenuSource: MenuSource = USE_MOCK ? 'mock' : 'api';

export const getMenuSource = (): MenuSource => lastMenuSource;

const withApiFallback = async <T>(
  label: string,
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>
): Promise<T> => {
  if (USE_MOCK) {
    lastMenuSource = 'mock';
    return mockCall();
  }

  try {
    const result = await apiCall();
    lastMenuSource = 'api';
    return result;
  } catch (error) {
    lastMenuSource = 'mock';
    console.warn(`[Menu API] ${label} failed, using mock data.`, error);
    return mockCall();
  }
};

/**
 * Get all menu categories
 */
export const getCategories = async (locationId?: string): Promise<MenuCategory[]> => {
  return withApiFallback(
    'getCategories',
    async () => {
      const suffix = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
      const response = await apiClient.get<{ categories: MenuCategory[] }>(`/menu/categories${suffix}`);
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
export const getMenuItems = async (locationId?: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'getMenuItems',
    async () => {
      const suffix = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
      const response = await apiClient.get<{ items: MenuItem[] }>(`/menu/items${suffix}`);
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
export const getMenuItemsByCategory = async (categoryId: string, locationId?: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'getMenuItemsByCategory',
    async () => {
      const locationSuffix = locationId ? `&locationId=${encodeURIComponent(locationId)}` : '';
      const response = await apiClient.get<{ items: MenuItem[] }>(
        `/menu/items?category=${encodeURIComponent(categoryId)}${locationSuffix}`
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
export const getPopularItems = async (locationId?: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'getPopularItems',
    async () => {
      const locationSuffix = locationId ? `&locationId=${encodeURIComponent(locationId)}` : '';
      const response = await apiClient.get<{ items: MenuItem[] }>(
        `/menu/items?popular=true${locationSuffix}`
      );
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
export const getNewItems = async (locationId?: string): Promise<MenuItem[]> => {
  return withApiFallback(
    'getNewItems',
    async () => {
      const suffix = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
      const response = await apiClient.get<{ new: MenuItem[] }>(`/menu/featured${suffix}`);
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
