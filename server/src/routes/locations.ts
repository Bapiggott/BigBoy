import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

interface LocationHours {
  [key: string]: { open: string; close: string } | null;
}

/**
 * GET /api/locations
 * Get all locations with optional search
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, lat, lng, radius } = req.query;
    
    const where: Record<string, unknown> = {
      isActive: true,
    };
    
    // Text search
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr } },
        { city: { contains: searchStr } },
        { zipCode: { startsWith: searchStr } },
        { address: { contains: searchStr } },
      ];
    }
    
    let locations = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    
    // Filter by distance if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = radius ? parseFloat(radius as string) : 50;
      
      locations = locations
        .map(loc => ({
          ...loc,
          distance: calculateDistance(userLat, userLng, Number(loc.latitude), Number(loc.longitude)),
        }))
        .filter(loc => loc.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance);
    }
    
    res.json({
      locations: locations.map(formatLocation),
      count: locations.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const location = await prisma.location.findUnique({
      where: { id },
    });
    
    if (!location || !location.isActive) {
      throw createError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }
    
    res.json({ location: formatLocation(location) });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/locations/nearby/:lat/:lng
 */
router.get('/nearby/:lat/:lng', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.params;
    const { limit = '5', radius = '25' } = req.query;
    
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius as string);
    const maxResults = parseInt(limit as string);
    
    if (isNaN(userLat) || isNaN(userLng)) {
      throw createError('Invalid coordinates', 400);
    }
    
    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });
    
    const nearby = locations
      .map(loc => ({
        ...loc,
        distance: calculateDistance(userLat, userLng, Number(loc.latitude), Number(loc.longitude)),
      }))
      .filter(loc => loc.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);
    
    res.json({
      locations: nearby.map(formatLocation),
      count: nearby.length,
    });
  } catch (error) {
    next(error);
  }
});

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function isLocationOpen(hours: LocationHours): boolean {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime < closeTime;
}

function formatLocation(location: {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  latitude: unknown;
  longitude: unknown;
  hours: unknown;
  hasDineIn: boolean;
  hasTakeout: boolean;
  hasDriveThru: boolean;
  hasWifi: boolean;
  hasPlayground: boolean;
  isAccessible: boolean;
  distance?: number;
}) {
  const hours = location.hours as LocationHours;
  
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    phone: location.phone,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    hours,
    isOpen: isLocationOpen(hours),
    amenities: {
      dineIn: location.hasDineIn,
      takeout: location.hasTakeout,
      driveThru: location.hasDriveThru,
      wifi: location.hasWifi,
      playground: location.hasPlayground,
      accessible: location.isAccessible,
    },
    distance: location.distance,
  };
}

export default router;
