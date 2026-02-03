import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
});

const addressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  unit: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(5),
  isDefault: z.boolean().optional(),
});

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  rewardAlerts: z.boolean().optional(),
  defaultOrderType: z.enum(['PICKUP', 'DINE_IN', 'DELIVERY']).optional(),
  defaultLocationId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/users/profile
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        lifetimePoints: true,
        memberSince: true,
        createdAt: true,
      },
    });
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/profile
 */
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
    
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/addresses
 */
router.get('/addresses', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    
    res.json({ addresses });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/addresses
 */
router.post('/addresses', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = addressSchema.parse(req.body);
    
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }
    
    const address = await prisma.address.create({
      data: {
        ...data,
        userId: req.user!.userId,
      },
    });
    
    res.status(201).json({ address, message: 'Address added successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/addresses/:id
 */
router.put('/addresses/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = addressSchema.partial().parse(req.body);
    
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });
    
    if (!existing) {
      throw createError('Address not found', 404);
    }
    
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId, id: { not: id } },
        data: { isDefault: false },
      });
    }
    
    const address = await prisma.address.update({
      where: { id },
      data,
    });
    
    res.json({ address, message: 'Address updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/addresses/:id
 */
router.delete('/addresses/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });
    
    if (!existing) {
      throw createError('Address not found', 404);
    }
    
    await prisma.address.delete({ where: { id } });
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/preferences
 */
router.get('/preferences', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user!.userId },
    });
    
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId: req.user!.userId },
      });
    }
    
    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/preferences
 */
router.put('/preferences', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = preferencesSchema.parse(req.body);
    
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.user!.userId },
      update: data,
      create: {
        userId: req.user!.userId,
        ...data,
      },
    });
    
    res.json({ preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/loyalty
 */
router.get('/loyalty', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        lifetimePoints: true,
        memberSince: true,
      },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const tierThresholds = { BRONZE: 0, SILVER: 1000, GOLD: 5000 };
    const currentTierThreshold = tierThresholds[user.loyaltyTier as keyof typeof tierThresholds];
    const nextTier = user.loyaltyTier === 'BRONZE' ? 'SILVER' : user.loyaltyTier === 'SILVER' ? 'GOLD' : null;
    const nextTierThreshold = nextTier ? tierThresholds[nextTier] : null;
    
    res.json({
      loyalty: {
        currentPoints: user.loyaltyPoints,
        lifetimePoints: user.lifetimePoints,
        currentTier: user.loyaltyTier,
        memberSince: user.memberSince.toISOString(),
        nextTier,
        pointsToNextTier: nextTierThreshold ? nextTierThreshold - user.lifetimePoints : null,
        tierProgress: nextTierThreshold 
          ? Math.min(100, Math.round((user.lifetimePoints - currentTierThreshold) / (nextTierThreshold - currentTierThreshold) * 100))
          : 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/account
 */
router.delete('/account', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({
      where: { id: req.user!.userId },
    });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
