import { apiClient } from '../client';
import { MenuItem } from '../../types';

/**
 * Favorites API Endpoints
 */
export const getFavorites = async (): Promise<MenuItem[]> => {
  const response = await apiClient.get<{ favorites: MenuItem[] }>('/favorites');

  if (response.success) {
    return response.data?.favorites ?? [];
  }

  throw new Error(response.error ?? 'Failed to fetch favorites');
};

export const addFavorite = async (menuItemId: string): Promise<boolean> => {
  const response = await apiClient.post<{ itemId: string }>(`/favorites`, { itemId: menuItemId });
  if (!response.success) {
    // Throw so UI can show the real reason (401 vs token missing vs network)
    throw new Error(response.error ?? 'Failed to add favorite');
  }
  return true;
};

export const removeFavorite = async (menuItemId: string): Promise<boolean> => {
  const response = await apiClient.delete<{ itemId: string }>(`/favorites/${menuItemId}`);
  if (!response.success) {
    throw new Error(response.error ?? 'Failed to remove favorite');
  }
  return true;
};
