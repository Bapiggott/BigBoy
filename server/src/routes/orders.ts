import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index.js';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().optional(),
  modifiers: z.array(z.object({
    modifierId: z.string().uuid(),
  })).optional(),
});

const createOrderSchema = z.object({
  locationId: z.string().uuid(),
  type: z.enum(['PICKUP', 'DINE_IN', 'DELIVERY']),
  items: z.array(orderItemSchema).min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  paymentMethod: z.string(),
  scheduledFor: z.string().datetime().optional(),
  specialInstructions: z.string().optional(),
  tip: z.number().min(0).optional(),
  redeemPoints: z.number().int().min(0).optional(),
});

const TAX_RATE = 0.06;
const POINTS_PER_DOLLAR = 10;

/**
 * POST /api/orders
 */
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createOrderSchema.parse(req.body);
    
    // Verify location
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });
    
    if (!location || !location.isActive) {
      throw createError('Location not found or unavailable', 404);
    }
    
    // Get menu items
    const menuItemIds = data.items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: {
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: true },
            },
          },
        },
      },
    });
    
    // Build order items and calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      specialInstructions?: string;
      modifiers: Array<{ modifierId: string; name: string; price: number }>;
    }> = [];
    
    for (const item of data.items) {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      
      if (!menuItem || !menuItem.isAvailable) {
        throw createError(`Menu item ${item.menuItemId} is not available`, 400);
      }
      
      let itemTotal = Number(menuItem.price);
      const modifiers: Array<{ modifierId: string; name: string; price: number }> = [];
      
      if (item.modifiers) {
        for (const mod of item.modifiers) {
          let foundModifier = null;
          for (const mg of menuItem.modifierGroups) {
            const modifier = mg.modifierGroup.modifiers.find(m => m.id === mod.modifierId);
            if (modifier) {
              foundModifier = modifier;
              break;
            }
          }
          
          if (foundModifier) {
            itemTotal += Number(foundModifier.price);
            modifiers.push({
              modifierId: foundModifier.id,
              name: foundModifier.name,
              price: Number(foundModifier.price),
            });
          }
        }
      }
      
      const totalPrice = itemTotal * item.quantity;
      subtotal += totalPrice;
      
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: itemTotal,
        totalPrice,
        specialInstructions: item.specialInstructions,
        modifiers,
      });
    }
    
    // Calculate totals
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const tip = data.tip || 0;
    let discount = 0;
    let pointsRedeemed = 0;
    
    // Handle points redemption
    if (req.user && data.redeemPoints && data.redeemPoints > 0) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      
      if (user && user.loyaltyPoints >= data.redeemPoints) {
        discount = Math.min(data.redeemPoints / 100, subtotal);
        pointsRedeemed = Math.floor(discount * 100);
      }
    }
    
    const total = Math.round((subtotal + tax + tip - discount) * 100) / 100;
    const pointsEarned = Math.floor(total * POINTS_PER_DOLLAR);
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Estimate ready time
    const baseTime = 15;
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const extraTime = Math.min(itemCount * 2, 15);
    const estimatedReady = new Date(Date.now() + (baseTime + extraTime) * 60000);
    
    // Create order
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user?.userId,
          locationId: data.locationId,
          type: data.type,
          status: 'PENDING',
          subtotal,
          tax,
          tip,
          discount,
          total,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === 'cash' ? 'PENDING' : 'AUTHORIZED',
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          estimatedReady,
          pointsEarned,
          pointsRedeemed,
          specialInstructions: data.specialInstructions,
          items: {
            create: orderItems.map(item => ({
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              specialInstructions: item.specialInstructions,
              modifiers: {
                create: item.modifiers.map(mod => ({
                  modifierId: mod.modifierId,
                  name: mod.name,
                  price: mod.price,
                })),
              },
            })),
          },
        },
        include: {
          items: { include: { modifiers: true } },
          location: { select: { id: true, name: true, address: true, phone: true } },
        },
      });
      
      // Update user points
      if (req.user) {
        await tx.user.update({
          where: { id: req.user.userId },
          data: {
            loyaltyPoints: { increment: pointsEarned - pointsRedeemed },
            lifetimePoints: { increment: pointsEarned },
          },
        });
      }
      
      return newOrder;
    });
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: formatOrder(order),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, limit = '20', offset = '0' } = req.query;
    
    const where: Record<string, unknown> = {
      userId: req.user!.userId,
    };
    
    if (status) {
      where.status = status as string;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { modifiers: true } },
          location: { select: { id: true, name: true, address: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.order.count({ where }),
    ]);
    
    res.json({
      orders: orders.map(formatOrder),
      total,
      hasMore: parseInt(offset as string) + orders.length < total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            modifiers: true,
            menuItem: { select: { imageUrl: true } },
          },
        },
        location: {
          select: { id: true, name: true, address: true, city: true, state: true, zipCode: true, phone: true },
        },
      },
    });
    
    if (!order) {
      throw createError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    if (order.userId && req.user && order.userId !== req.user.userId) {
      throw createError('Not authorized to view this order', 403);
    }
    
    res.json({ order: formatOrder(order) });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/orders/:id/cancel
 */
router.put('/:id/cancel', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({ where: { id } });
    
    if (!order) {
      throw createError('Order not found', 404);
    }
    
    if (order.userId && req.user && order.userId !== req.user.userId) {
      throw createError('Not authorized', 403);
    }
    
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw createError('Order cannot be cancelled at this stage', 400);
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'AUTHORIZED' ? 'REFUNDED' : order.paymentStatus,
        },
      });
      
      if (order.userId) {
        await tx.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: { decrement: order.pointsEarned - order.pointsRedeemed },
            lifetimePoints: { decrement: order.pointsEarned },
          },
        });
      }
      
      return cancelled;
    });
    
    res.json({
      message: 'Order cancelled successfully',
      order: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    next(error);
  }
});

function generateOrderNumber(): string {
  const prefix = 'BB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();
  return `${prefix}${timestamp}${random}`.slice(0, 12);
}

function formatOrder(order: {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: unknown;
  tax: unknown;
  tip: unknown;
  discount: unknown;
  total: unknown;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  paymentMethod: string;
  paymentStatus: string;
  scheduledFor: Date | null;
  estimatedReady: Date | null;
  completedAt: Date | null;
  pointsEarned: number;
  pointsRedeemed: number;
  specialInstructions: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    totalPrice: unknown;
    specialInstructions: string | null;
    modifiers: Array<{ id: string; name: string; price: unknown }>;
    menuItem?: { imageUrl: string | null };
  }>;
  location: {
    id: string;
    name: string;
    address: string;
    phone: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    tip: Number(order.tip),
    discount: Number(order.discount),
    total: Number(order.total),
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
    },
    scheduledFor: order.scheduledFor?.toISOString(),
    estimatedReady: order.estimatedReady?.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    pointsEarned: order.pointsEarned,
    pointsRedeemed: order.pointsRedeemed,
    specialInstructions: order.specialInstructions,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      specialInstructions: item.specialInstructions,
      imageUrl: item.menuItem?.imageUrl,
      modifiers: item.modifiers.map(mod => ({
        id: mod.id,
        name: mod.name,
        price: Number(mod.price),
      })),
    })),
    location: order.location,
  };
}

export default router;
