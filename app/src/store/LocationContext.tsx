import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Location } from '../types';
import { appStorage } from '../utils/storage';
import * as locationsApi from '../api/endpoints/locations';
import { mockLocations } from '../data/mockLocations';

interface LocationContextValue {
  selectedLocation: Location | null;
  locations: Location[];
  isLoading: boolean;
  selectLocation: (location: Location) => Promise<void>;
  clearLocation: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  getNearbyLocations: (lat: number, lng: number, radius?: number) => Promise<Location[]>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load locations and selected location on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load all locations
        const apiLocations = await locationsApi.getLocations();
        const allLocations = apiLocations.length > 0 ? apiLocations : mockLocations;
        setLocations(allLocations);

        // Check for saved selected location
        const savedLocationId = await appStorage.getSelectedLocation();
        if (savedLocationId) {
          const savedLocation = allLocations.find(l => l.id === savedLocationId);
          if (savedLocation) {
            setSelectedLocation(savedLocation);
          }
        }
        if (!savedLocationId) {
          const defaultLocation = allLocations.find(l => l.status === 'open') ?? allLocations[0];
          if (defaultLocation) {
            setSelectedLocation(defaultLocation);
            await appStorage.setSelectedLocation(defaultLocation.id);
          }
        }
      } catch (error) {
        console.error('Failed to load locations:', error);
        setLocations(mockLocations);
        if (!selectedLocation) {
          const fallbackLocation = mockLocations.find(l => l.status === 'open') ?? mockLocations[0];
          if (fallbackLocation) {
            setSelectedLocation(fallbackLocation);
            await appStorage.setSelectedLocation(fallbackLocation.id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const selectLocation = useCallback(async (location: Location) => {
    setSelectedLocation(location);
    await appStorage.setSelectedLocation(location.id);
  }, []);

  const clearLocation = useCallback(async () => {
    setSelectedLocation(null);
    await appStorage.setSelectedLocation('');
  }, []);

  const refreshLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const allLocations = await locationsApi.getLocations();
      setLocations(allLocations);
    } catch (error) {
      console.error('Failed to refresh locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNearbyLocations = useCallback(async (lat: number, lng: number, radius = 50): Promise<Location[]> => {
    try {
      return await locationsApi.getNearbyLocations(lat, lng, radius);
    } catch (error) {
      console.error('Failed to get nearby locations:', error);
      return [];
    }
  }, []);

  return (
    <LocationContext.Provider value={{
      selectedLocation,
      locations,
      isLoading,
      selectLocation,
      clearLocation,
      refreshLocations,
      getNearbyLocations,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
