import { apiClient } from '../client';
import { Location } from '../../types';
import { mockLocations } from '../../data/mockLocations';

/**
 * Locations API Endpoints
 * Currently returns mock data - swap implementation when backend is ready
 */

const USE_MOCK = true;

/**
 * Get all locations
 */
export const getLocations = async (): Promise<Location[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockLocations;
  }

  const response = await apiClient.get<{ locations: Location[] }>('/locations');
  return response.success && response.data ? response.data.locations : [];
};

/**
 * Get a single location by ID
 */
export const getLocation = async (locationId: string): Promise<Location | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLocations.find(loc => loc.id === locationId) ?? null;
  }

  const response = await apiClient.get<{ location: Location }>(`/locations/${locationId}`);
  return response.success ? response.data?.location ?? null : null;
};

/**
 * Get locations near coordinates
 */
export const getNearbyLocations = async (
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<Location[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simple distance calculation (Haversine formula approximation)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const locationsWithDistance = mockLocations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.latitude!, loc.longitude!),
      }))
      .filter(loc => loc.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    return locationsWithDistance;
  }

  const response = await apiClient.get<{ locations: Location[] }>(
    `/locations/nearby/${latitude}/${longitude}?radius=${radiusMiles}`
  );
  return response.success && response.data ? response.data.locations : [];
};

/**
 * Search locations by city or zip code
 */
export const searchLocations = async (query: string): Promise<Location[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const lowerQuery = query.toLowerCase();
    return mockLocations.filter(
      loc =>
        loc.city.toLowerCase().includes(lowerQuery) ||
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.zipCode.includes(query) ||
        loc.address.toLowerCase().includes(lowerQuery)
    );
  }

  const response = await apiClient.get<{ locations: Location[] }>(
    `/locations?search=${encodeURIComponent(query)}`
  );
  return response.success && response.data ? response.data.locations : [];
};

/**
 * Get locations by state
 */
export const getLocationsByState = async (state: string): Promise<Location[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockLocations.filter(
      loc => loc.state.toLowerCase() === state.toLowerCase()
    );
  }

  const response = await apiClient.get<{ locations: Location[] }>(`/locations?state=${state}`);
  return response.success && response.data ? response.data.locations : [];
};

/**
 * Check if a location is currently open
 */
export const isLocationOpen = (location: Location): boolean => {
  if (!location.hours) return true; // Assume open if no hours data

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[now.getDay()] as keyof typeof location.hours;
  const hoursToday = location.hours[dayName];

  if (!hoursToday || hoursToday.toLowerCase() === 'closed') return false;

  // Parse hours string (e.g., "7:00 AM - 10:00 PM")
  const [openStr, closeStr] = hoursToday.split(' - ');
  if (!openStr || !closeStr) return true;

  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    return hour24 * 60 + minutes;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTime(openStr);
  const closeMinutes = parseTime(closeStr);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};
