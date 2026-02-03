import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { adminAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// All admin routes require authentication
router.use(adminAuth);

const updatePointsSchema = z.object({
  points: z.number().int(),
  reason: z.string().optional(),
});

const updateTierSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
});

/**
 * GET /api/admin/users
 * Get all users (paginated)
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, limit = '20', offset = '0' } = req.query;
    
    const where: Record<string, unknown> = {};
    
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { email: { contains: searchStr } },
        { firstName: { contains: searchStr } },
        { lastName: { contains: searchStr } },
        { phone: { contains: searchStr } },
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      users: users.map(u => ({
        ...u,
        orderCount: u._count.orders,
        _count: undefined,
      })),
      total,
      hasMore: parseInt(offset as string) + users.length < total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:id
 */
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        preferences: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { location: { select: { name: true } } },
        },
        redeemedRewards: {
          take: 10,
          orderBy: { redeemedAt: 'desc' },
          include: { reward: true },
        },
      },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    
    res.json({ user: safeUser });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/points
 * Adjust user loyalty points
 */
router.patch('/users/:id/points', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updatePointsSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { loyaltyPoints: true },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const newPoints = Math.max(0, user.loyaltyPoints + data.points);
    
    const updated = await prisma.user.update({
      where: { id },
      data: {
        loyaltyPoints: newPoints,
        lifetimePoints: data.points > 0 
          ? { increment: data.points }
          : undefined,
      },
      select: {
        id: true,
        loyaltyPoints: true,
        lifetimePoints: true,
        loyaltyTier: true,
      },
    });
    
    res.json({
      message: `Points ${data.points >= 0 ? 'added' : 'removed'} successfully`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/users/:id/tier
 * Update user loyalty tier
 */
router.patch('/users/:id/tier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateTierSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id },
      data: { loyaltyTier: data.tier },
      select: {
        id: true,
        loyaltyTier: true,
      },
    });
    
    res.json({
      message: 'Tier updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 * Get all orders (paginated)
 */
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, locationId, limit = '20', offset = '0' } = req.query;
    
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status as string;
    }
    
    if (locationId) {
      where.locationId = locationId as string;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          location: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.order.count({ where }),
    ]);
    
    res.json({
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: o.type,
        status: o.status,
        total: Number(o.total),
        customerName: o.customerName,
        user: o.user,
        location: o.location,
        itemCount: o._count.items,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      hasMore: parseInt(offset as string) + orders.length < total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status
 */
router.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateOrderStatusSchema.parse(req.body);
    
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        completedAt: true,
      },
    });
    
    res.json({
      message: 'Order status updated',
      order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalUsers,
      totalOrders,
      todayOrders,
      activeOrders,
      revenueToday,
      usersByTier,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.user.groupBy({
        by: ['loyaltyTier'],
        _count: true,
      }),
    ]);
    
    res.json({
      stats: {
        totalUsers,
        totalOrders,
        todayOrders,
        activeOrders,
        revenueToday: Number(revenueToday._sum.total) || 0,
        usersByTier: usersByTier.reduce((acc, t) => {
          acc[t.loyaltyTier.toLowerCase()] = t._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/locations
 * Get all locations with order counts
 */
router.get('/locations', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    res.json({
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        city: loc.city,
        state: loc.state,
        isActive: loc.isActive,
        orderCount: loc._count.orders,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
