import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { MenuItem } from '../types';
import { useUser } from './UserContext';
import * as favoritesApi from '../api/endpoints/favorites';

interface FavoritesContextValue {
  favorites: MenuItem[];
  isLoading: boolean;
  refreshFavorites: () => Promise<void>;
  isFavorite: (menuItemId: string) => boolean;
  addFavorite: (item: MenuItem) => Promise<void>;
  removeFavorite: (menuItemId: string) => Promise<void>;
  toggleFavorite: (item: MenuItem) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isAuthenticated } = useUser();
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const items = await favoritesApi.getFavorites();
      setFavorites(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load favorites:', message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  const isFavorite = useCallback(
    (menuItemId: string) => favoriteIds.has(menuItemId),
    [favoriteIds]
  );

  const addFavorite = useCallback(
    async (item: MenuItem) => {
      if (favoriteIds.has(item.id)) return;

      // Optimistic update first (UI feels instant)
      setFavorites((prev) => [item, ...prev]);

      try {
        await favoritesApi.addFavorite(item.id);
        // Keep server + app aligned
        await refreshFavorites();
      } catch (error) {
        // Rollback if server failed
        setFavorites((prev) => prev.filter((x) => x.id !== item.id));
        const message = error instanceof Error ? error.message : String(error);
        console.error('Add favorite failed:', message);
        throw error;
      }
    },
    [favoriteIds, refreshFavorites]
  );

  const removeFavorite = useCallback(
    async (menuItemId: string) => {
      if (!favoriteIds.has(menuItemId)) return;

      const snapshot = favorites;
      setFavorites((prev) => prev.filter((item) => item.id !== menuItemId));

      try {
        await favoritesApi.removeFavorite(menuItemId);
        await refreshFavorites();
      } catch (error) {
        // Rollback
        setFavorites(snapshot);
        const message = error instanceof Error ? error.message : String(error);
        console.error('Remove favorite failed:', message);
        throw error;
      }
    },
    [favoriteIds, favorites, refreshFavorites]
  );

  const toggleFavorite = useCallback(
    async (item: MenuItem) => {
      if (favoriteIds.has(item.id)) {
        await removeFavorite(item.id);
      } else {
        await addFavorite(item);
      }
    },
    [addFavorite, favoriteIds, removeFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        refreshFavorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
