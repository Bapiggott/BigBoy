import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/menu/categories
 */
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: { where: { isAvailable: true } } },
        },
      },
    });
    
    res.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        itemCount: c._count.items,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/menu/items
 */
router.get('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, popular, search } = req.query;
    
    const where: Record<string, unknown> = {
      isAvailable: true,
    };
    
    if (category && category !== 'all') {
      const cat = await prisma.category.findFirst({
        where: { 
          OR: [
            { id: category as string },
            { slug: category as string },
          ],
        },
      });
      
      if (cat) {
        where.categoryId = cat.id;
      }
    }
    
    if (popular === 'true') {
      where.isPopular = true;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    
    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isPopular: 'desc' },
        { isNew: 'desc' },
        { name: 'asc' },
      ],
    });
    
    res.json({
      items: items.map(formatMenuItem),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/menu/items/:id
 */
router.get('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
    });
    
    if (!item) {
      throw createError('Menu item not found', 404, 'ITEM_NOT_FOUND');
    }
    
    res.json({
      item: formatMenuItem(item),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/menu/featured
 */
router.get('/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [popular, newItems] = await Promise.all([
      prisma.menuItem.findMany({
        where: { isAvailable: true, isPopular: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        take: 6,
      }),
      prisma.menuItem.findMany({
        where: { isAvailable: true, isNew: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        take: 4,
      }),
    ]);
    
    const formatSimple = (item: typeof popular[0]) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      calories: item.calories,
      isPopular: item.isPopular,
      isNew: item.isNew,
      category: item.category,
    });
    
    res.json({
      popular: popular.map(formatSimple),
      new: newItems.map(formatSimple),
    });
  } catch (error) {
    next(error);
  }
});

function formatMenuItem(item: {
  id: string;
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
  modifierGroups: Array<{
    modifierGroup: {
      id: string;
      name: string;
      description: string | null;
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      modifiers: Array<{
        id: string;
        name: string;
        price: unknown;
        calories: number | null;
        isDefault: boolean;
      }>;
    };
  }>;
}) {
  return {
    id: item.id,
    categoryId: item.category.id,
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
    modifierGroups: item.modifierGroups.map(mg => ({
      id: mg.modifierGroup.id,
      name: mg.modifierGroup.name,
      description: mg.modifierGroup.description,
      isRequired: mg.modifierGroup.isRequired,
      minSelect: mg.modifierGroup.minSelect,
      maxSelect: mg.modifierGroup.maxSelect,
      modifiers: mg.modifierGroup.modifiers.map(m => ({
        id: m.id,
        name: m.name,
        price: Number(m.price),
        priceAdjustment: Number(m.price),
        calories: m.calories,
        isDefault: m.isDefault,
      })),
    })),
  };
}

export default router;
