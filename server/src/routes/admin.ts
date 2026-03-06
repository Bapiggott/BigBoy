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

// Menu item schemas
const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().nullable().optional(),
  calories: z.number().int().nullable().optional(),
  prepTime: z.number().int().nullable().optional(),
  isPopular: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

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
          role: true,
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

// ============ MENU ITEM ADMIN ROUTES ============

/**
 * GET /api/admin/menu/items
 * Get all menu items (including unavailable)
 */
router.get('/menu/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, limit = '50', offset = '0' } = req.query;

    const where: Record<string, unknown> = {};

    if (category) {
      where.categoryId = category as string;
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr } },
        { description: { contains: searchStr } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.menuItem.count({ where }),
    ]);

    res.json({
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        calories: item.calories,
        prepTime: item.prepTime,
        isPopular: item.isPopular,
        isNew: item.isNew,
        isAvailable: item.isAvailable,
        categoryId: item.categoryId,
        category: item.category,
      })),
      total,
      hasMore: parseInt(offset as string) + items.length < total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/menu/categories
 * Get all categories
 */
router.get('/menu/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    res.json({
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        itemCount: cat._count.items,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/menu/items
 * Create a new menu item
 */
router.post('/menu/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createMenuItemSchema.parse(req.body);

    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const item = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl ?? null,
        calories: data.calories ?? null,
        prepTime: data.prepTime ?? null,
        isPopular: data.isPopular,
        isNew: data.isNew,
        isAvailable: data.isAvailable,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({
      message: 'Menu item created',
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        calories: item.calories,
        prepTime: item.prepTime,
        isPopular: item.isPopular,
        isNew: item.isNew,
        isAvailable: item.isAvailable,
        categoryId: item.categoryId,
        category: item.category,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/menu/items/:id
 * Update a menu item
 */
router.patch('/menu/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateMenuItemSchema.parse(req.body);

    // Check item exists
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      throw createError('Menu item not found', 404, 'ITEM_NOT_FOUND');
    }

    // Check category exists if changing
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        calories: data.calories,
        prepTime: data.prepTime,
        isPopular: data.isPopular,
        isNew: data.isNew,
        isAvailable: data.isAvailable,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({
      message: 'Menu item updated',
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        calories: item.calories,
        prepTime: item.prepTime,
        isPopular: item.isPopular,
        isNew: item.isNew,
        isAvailable: item.isAvailable,
        categoryId: item.categoryId,
        category: item.category,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/menu/items/:id
 * Delete a menu item
 */
router.delete('/menu/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check item exists
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      throw createError('Menu item not found', 404, 'ITEM_NOT_FOUND');
    }

    await prisma.menuItem.delete({ where: { id } });

    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/menu/items/:id/availability
 * Toggle menu item availability (quick action)
 */
router.patch('/menu/items/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      select: { id: true, name: true, isAvailable: true },
    });

    res.json({
      message: `${item.name} is now ${item.isAvailable ? 'available' : 'unavailable'}`,
      item,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/menu/items/:id/locations
 * Get location overrides for a menu item
 */
router.get('/menu/items/:id/locations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get all locations with their override status for this item
    const locations = await prisma.location.findMany({
      select: { id: true, name: true, city: true, state: true },
      orderBy: { name: 'asc' },
    });

    const overrides = await prisma.locationMenuOverride.findMany({
      where: { menuItemId: id },
      select: { locationId: true, isAvailable: true },
    });

    const overrideMap = new Map(overrides.map(o => [o.locationId, o.isAvailable]));

    const result = locations.map(loc => ({
      ...loc,
      isAvailable: overrideMap.get(loc.id) ?? true, // default = available
    }));

    res.json({ locations: result });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/menu/items/:id/locations
 * Set location availability for a menu item
 * Body: { overrides: [{ locationId: string, isAvailable: boolean }] }
 */
router.put('/menu/items/:id/locations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { overrides } = z.object({
      overrides: z.array(z.object({
        locationId: z.string(),
        isAvailable: z.boolean(),
      })),
    }).parse(req.body);

    // Verify menu item exists
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Upsert each override — delete rows where isAvailable=true (default), keep only exclusions
    for (const override of overrides) {
      if (override.isAvailable) {
        // Remove override (default = available), so no row needed
        await prisma.locationMenuOverride.deleteMany({
          where: { menuItemId: id, locationId: override.locationId },
        });
      } else {
        // Upsert exclusion
        await prisma.locationMenuOverride.upsert({
          where: {
            locationId_menuItemId: {
              locationId: override.locationId,
              menuItemId: id,
            },
          },
          create: {
            locationId: override.locationId,
            menuItemId: id,
            isAvailable: false,
          },
          update: { isAvailable: false },
        });
      }
    }

    res.json({ message: 'Location availability updated' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PROMO CODES
// ============================================================

const createPromoCodeSchema = z.object({
  code: z.string().min(2).max(30).transform(s => s.toUpperCase().replace(/\s/g, '')),
  name: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'FREE_ITEM', 'BOGO_CATEGORY']),
  discountValue: z.number().min(0),
  template: z.enum(['CUSTOM', 'PERCENT_OFF', 'DOLLAR_OFF', 'BOGO_ITEM', 'BOGO_CATEGORY_DEAL', 'FREE_ITEM_DEAL', 'HAPPY_HOUR', 'LOYALTY_BONUS', 'FIRST_ORDER', 'SEASONAL']).default('CUSTOM'),
  minOrderAmount: z.number().min(0).nullable().optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  applicableItemId: z.string().nullable().optional(),
  applicableCategoryId: z.string().nullable().optional(),
  maxTotalUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
  locationIds: z.array(z.string()).default([]), // empty = all locations
});

/**
 * GET /api/admin/promo-codes
 */
router.get('/promo-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, active, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [codes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          locations: { include: { location: { select: { id: true, name: true } } } },
          applicableItem: { select: { id: true, name: true } },
          applicableCategory: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.promoCode.count({ where }),
    ]);

    res.json({
      promoCodes: codes.map(c => ({
        ...c,
        discountValue: Number(c.discountValue),
        minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        timesUsed: c._count.orders,
        locations: c.locations.map(l => l.location),
      })),
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/promo-codes
 */
router.post('/promo-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPromoCodeSchema.parse(req.body);

    // Check code uniqueness
    const existing = await prisma.promoCode.findUnique({ where: { code: data.code } });
    if (existing) { res.status(409).json({ error: 'Promo code already exists' }); return; }

    const { locationIds, ...promoData } = data;
    const code = await prisma.promoCode.create({
      data: {
        ...promoData,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        locations: locationIds.length > 0 ? {
          create: locationIds.map(lid => ({ locationId: lid })),
        } : undefined,
      },
      include: {
        locations: { include: { location: { select: { id: true, name: true } } } },
        applicableItem: { select: { id: true, name: true } },
        applicableCategory: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Promo code created', promoCode: code });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/promo-codes/:id
 */
router.patch('/promo-codes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createPromoCodeSchema.partial().parse(req.body);
    const { locationIds, ...updateData } = data;

    const code = await prisma.$transaction(async (tx) => {
      if (locationIds !== undefined) {
        await tx.promoCodeLocation.deleteMany({ where: { promoCodeId: id } });
        if (locationIds.length > 0) {
          await tx.promoCodeLocation.createMany({
            data: locationIds.map(lid => ({ promoCodeId: id, locationId: lid })),
          });
        }
      }

      return tx.promoCode.update({
        where: { id },
        data: {
          ...updateData,
          startsAt: updateData.startsAt ? new Date(updateData.startsAt) : undefined,
          expiresAt: updateData.expiresAt !== undefined
            ? (updateData.expiresAt ? new Date(updateData.expiresAt) : null)
            : undefined,
        },
        include: {
          locations: { include: { location: { select: { id: true, name: true } } } },
          applicableItem: { select: { id: true, name: true } },
          applicableCategory: { select: { id: true, name: true } },
        },
      });
    });

    res.json({ message: 'Promo code updated', promoCode: code });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/promo-codes/:id
 */
router.delete('/promo-codes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/promo-codes/:id/toggle
 */
router.patch('/promo-codes/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
    if (!code) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: { isActive: !code.isActive },
    });
    res.json({ message: `Promo code ${updated.isActive ? 'activated' : 'deactivated'}`, promoCode: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DISCOUNTS (auto-applied deals)
// ============================================================

const createDiscountSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'FREE_ITEM', 'BOGO_CATEGORY']),
  discountValue: z.number().min(0),
  template: z.enum(['CUSTOM', 'PERCENT_OFF', 'DOLLAR_OFF', 'BOGO_ITEM', 'BOGO_CATEGORY_DEAL', 'FREE_ITEM_DEAL', 'HAPPY_HOUR', 'LOYALTY_BONUS', 'FIRST_ORDER', 'SEASONAL']).default('CUSTOM'),
  minOrderAmount: z.number().min(0).nullable().optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  applicableItemId: z.string().nullable().optional(),
  applicableCategoryId: z.string().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  activeDays: z.string().nullable().optional(),
  activeTimeStart: z.string().nullable().optional(),
  activeTimeEnd: z.string().nullable().optional(),
  stackable: z.boolean().default(false),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  locationIds: z.array(z.string()).default([]),
});

/**
 * GET /api/admin/discounts
 */
router.get('/discounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        include: {
          locations: { include: { location: { select: { id: true, name: true } } } },
          applicableItem: { select: { id: true, name: true } },
          applicableCategory: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.discount.count({ where }),
    ]);

    res.json({
      discounts: discounts.map(d => ({
        ...d,
        discountValue: Number(d.discountValue),
        minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
        maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
        timesUsed: d._count.orders,
        locations: d.locations.map(l => l.location),
      })),
      total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/discounts
 */
router.post('/discounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createDiscountSchema.parse(req.body);
    const { locationIds, ...discountData } = data;

    const discount = await prisma.discount.create({
      data: {
        ...discountData,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        locations: locationIds.length > 0 ? {
          create: locationIds.map(lid => ({ locationId: lid })),
        } : undefined,
      },
      include: {
        locations: { include: { location: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json({ message: 'Discount created', discount });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/discounts/:id
 */
router.patch('/discounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createDiscountSchema.partial().parse(req.body);
    const { locationIds, ...updateData } = data;

    const discount = await prisma.$transaction(async (tx) => {
      if (locationIds !== undefined) {
        await tx.discountLocation.deleteMany({ where: { discountId: id } });
        if (locationIds.length > 0) {
          await tx.discountLocation.createMany({
            data: locationIds.map(lid => ({ discountId: id, locationId: lid })),
          });
        }
      }

      return tx.discount.update({
        where: { id },
        data: {
          ...updateData,
          startsAt: updateData.startsAt ? new Date(updateData.startsAt) : undefined,
          expiresAt: updateData.expiresAt !== undefined
            ? (updateData.expiresAt ? new Date(updateData.expiresAt) : null)
            : undefined,
        },
        include: {
          locations: { include: { location: { select: { id: true, name: true } } } },
        },
      });
    });

    res.json({ message: 'Discount updated', discount });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/discounts/:id
 */
router.delete('/discounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.discount.delete({ where: { id: req.params.id } });
    res.json({ message: 'Discount deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/discounts/:id/toggle
 */
router.patch('/discounts/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await prisma.discount.findUnique({ where: { id: req.params.id } });
    if (!d) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await prisma.discount.update({
      where: { id: req.params.id },
      data: { isActive: !d.isActive },
    });
    res.json({ message: `Discount ${updated.isActive ? 'activated' : 'deactivated'}`, discount: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// REWARDS (points-based, admin CRUD)
// ============================================================

const createRewardSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  imageUrl: z.string().nullable().optional(),
  pointsCost: z.number().int().positive(),
  category: z.enum(['FOOD', 'DRINK', 'DESSERT', 'COMBO', 'MERCHANDISE']),
  minTier: z.enum(['BRONZE', 'SILVER', 'GOLD']).default('BRONZE'),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/rewards
 */
router.get('/rewards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active, category } = req.query;
    const where: Record<string, unknown> = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    if (category) where.category = category;

    const rewards = await prisma.reward.findMany({
      where,
      include: { _count: { select: { userRewards: true } } },
      orderBy: { pointsCost: 'asc' },
    });

    res.json({
      rewards: rewards.map(r => ({
        ...r,
        totalRedeemed: r._count.userRewards,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/rewards
 */
router.post('/rewards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRewardSchema.parse(req.body);

    const reward = await prisma.reward.create({
      data: {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });

    res.status(201).json({ message: 'Reward created', reward });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/rewards/:id
 */
router.patch('/rewards/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRewardSchema.partial().parse(req.body);

    const reward = await prisma.reward.update({
      where: { id: req.params.id },
      data: {
        ...data,
        validFrom: data.validFrom !== undefined
          ? (data.validFrom ? new Date(data.validFrom) : null)
          : undefined,
        validUntil: data.validUntil !== undefined
          ? (data.validUntil ? new Date(data.validUntil) : null)
          : undefined,
      },
    });

    res.json({ message: 'Reward updated', reward });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/rewards/:id
 */
router.delete('/rewards/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.reward.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reward deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/rewards/:id/toggle
 */
router.patch('/rewards/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await prisma.reward.findUnique({ where: { id: req.params.id } });
    if (!r) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await prisma.reward.update({
      where: { id: req.params.id },
      data: { isActive: !r.isActive },
    });
    res.json({ message: `Reward ${updated.isActive ? 'activated' : 'deactivated'}`, reward: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// USER ROLE MANAGEMENT
// ============================================================

/**
 * PATCH /api/admin/users/:id/role
 */
router.patch('/users/:id/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = z.object({ role: z.enum(['USER', 'ADMIN']) }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    res.json({ message: `${user.firstName} is now ${role}`, user });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PROMO CODE VALIDATION (public-facing, called during checkout)
// ============================================================

/**
 * POST /api/admin/validate-promo
 * (This uses adminAuth but we'll also create a public route — see below)
 */

// ============================================================
// TEMPLATES (convenience endpoint to get template configs)
// ============================================================

/**
 * GET /api/admin/promo-templates
 */
router.get('/promo-templates', async (_req: Request, res: Response) => {
  res.json({
    templates: [
      {
        id: 'PERCENT_OFF',
        name: 'Percentage Off',
        description: 'Take a percentage off the entire order',
        discountType: 'PERCENTAGE',
        icon: 'pricetag',
        fields: ['discountValue', 'minOrderAmount', 'maxDiscount'],
        defaults: { discountValue: 20, maxUsesPerUser: 1 },
      },
      {
        id: 'DOLLAR_OFF',
        name: 'Dollar Amount Off',
        description: 'Fixed dollar amount off the order',
        discountType: 'FIXED_AMOUNT',
        icon: 'cash',
        fields: ['discountValue', 'minOrderAmount'],
        defaults: { discountValue: 5, maxUsesPerUser: 1 },
      },
      {
        id: 'BOGO_ITEM',
        name: 'Buy One Get One',
        description: 'Buy one of a specific item, get one free or discounted',
        discountType: 'BOGO',
        icon: 'duplicate',
        fields: ['applicableItemId', 'discountValue'],
        defaults: { discountValue: 100 }, // 100 = free, 50 = half off
      },
      {
        id: 'BOGO_CATEGORY_DEAL',
        name: 'BOGO Category',
        description: 'Buy one from a category, get one free',
        discountType: 'BOGO_CATEGORY',
        icon: 'albums',
        fields: ['applicableCategoryId', 'discountValue'],
        defaults: { discountValue: 100 },
      },
      {
        id: 'FREE_ITEM_DEAL',
        name: 'Free Item',
        description: 'Get a specific item for free',
        discountType: 'FREE_ITEM',
        icon: 'gift',
        fields: ['applicableItemId'],
        defaults: { discountValue: 100 },
      },
      {
        id: 'HAPPY_HOUR',
        name: 'Happy Hour',
        description: 'Time-based discount during specific hours',
        discountType: 'PERCENTAGE',
        icon: 'beer',
        fields: ['discountValue', 'activeTimeStart', 'activeTimeEnd', 'activeDays'],
        defaults: { discountValue: 25, activeTimeStart: '15:00', activeTimeEnd: '18:00' },
      },
      {
        id: 'FIRST_ORDER',
        name: 'First Order Discount',
        description: 'Special discount for first-time customers',
        discountType: 'PERCENTAGE',
        icon: 'sparkles',
        fields: ['discountValue', 'maxDiscount'],
        defaults: { discountValue: 15, maxUsesPerUser: 1 },
      },
      {
        id: 'SEASONAL',
        name: 'Seasonal Promotion',
        description: 'Limited-time seasonal offer',
        discountType: 'PERCENTAGE',
        icon: 'calendar',
        fields: ['discountValue', 'startsAt', 'expiresAt'],
        defaults: { discountValue: 10 },
      },
    ],
  });
});

export default router;
