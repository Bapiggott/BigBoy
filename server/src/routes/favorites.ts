import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

const formatFavoriteMenuItem = (item: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: unknown;
  imageUrl: string | null;
  calories: number | null;
  prepTime: number | null;
  isPopular: boolean;
  isNew: boolean;
  isAvailable: boolean;
  category: { id: string; name: string; slug: string };
}) => ({
  id: item.id,
  categoryId: item.categoryId,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  imageUrl: item.imageUrl,
  calories: item.calories,
  prepTime: item.prepTime,
  isPopular: item.isPopular,
  isNew: item.isNew,
  isAvailable: item.isAvailable,
  category: item.category,
});

/**
 * GET /api/favorites
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.userId },
      include: {
        menuItem: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      favorites: favorites.map((favorite) => formatFavoriteMenuItem(favorite.menuItem)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/favorites
 * body: { itemId }
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.body as { itemId?: string };

    if (!itemId) {
      throw createError('itemId is required', 400, 'ITEM_ID_REQUIRED');
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!menuItem) {
      throw createError('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
    }

    await prisma.favorite.upsert({
      where: {
        userId_menuItemId: {
          userId: req.user!.userId,
          menuItemId: itemId,
        },
      },
      update: {},
      create: {
        userId: req.user!.userId,
        menuItemId: itemId,
      },
    });

    res.status(201).json({ itemId, message: 'Added to favorites' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/favorites/:itemId
 */
router.delete('/:itemId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;

    const result = await prisma.favorite.deleteMany({
      where: {
        userId: req.user!.userId,
        menuItemId: itemId,
      },
    });

    if (result.count === 0) {
      throw createError('Favorite not found', 404, 'FAVORITE_NOT_FOUND');
    }

    res.json({ itemId, message: 'Removed from favorites' });
  } catch (error) {
    next(error);
  }
});

export default router;
