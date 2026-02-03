import menuSource from './bigboy.menu.json';
import { MenuCategory, MenuItem, ModifierGroup } from '../types';

type MenuSource = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sortOrder?: number;
  }>;
  items: Array<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
    calories?: number | null;
    imageKey?: string | null;
  }>;
};

const DEFAULT_PRICE_BY_CATEGORY_SLUG: Record<string, number> = {
  'current-promotion': 12.99,
  appetizers: 8.99,
  'sides-drinks': 3.49,
  breakfast: 9.99,
  burgers: 12.99,
  'sandwiches-and-wraps': 11.99,
  'soups-salads': 9.49,
  dinners: 14.99,
  desserts: 5.99,
  'kids-meals': 6.99,
};

const menuData = menuSource as MenuSource;

const categoriesById = new Map(menuData.categories.map((category) => [category.id, category]));
const promotionCategoryIds = new Set(
  menuData.categories.filter((category) => category.slug === 'current-promotion').map((category) => category.id)
);

const itemCountByCategory = new Map<string, number>();
menuData.items.forEach((item) => {
  itemCountByCategory.set(item.categoryId, (itemCountByCategory.get(item.categoryId) ?? 0) + 1);
});

/**
 * Big Boy Menu Categories (fallback)
 */
export const mockCategories: MenuCategory[] = menuData.categories.map((category, index) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description ?? undefined,
  itemCount: itemCountByCategory.get(category.id) ?? 0,
}));

/**
 * Big Boy Menu Items (fallback)
 */
export const mockMenuItems: MenuItem[] = menuData.items.map((item) => {
  const category = categoriesById.get(item.categoryId);
  const categorySlug = category?.slug ?? 'uncategorized';
  const price = DEFAULT_PRICE_BY_CATEGORY_SLUG[categorySlug] ?? 9.99;

  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description || '',
    price,
    calories: item.calories ?? undefined,
    imageUrl: item.imageKey ?? undefined,
    isAvailable: true,
    isNew: promotionCategoryIds.has(item.categoryId),
  };
});

/**
 * Modifier Groups (kept for future use)
 */
export const mockModifierGroups: ModifierGroup[] = [
  {
    id: 'mod-cooktemp',
    name: 'Cook Temperature',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    modifiers: [
      { id: 'cook-mr', name: 'Medium Rare', price: 0, isDefault: false },
      { id: 'cook-m', name: 'Medium', price: 0, isDefault: true },
      { id: 'cook-mw', name: 'Medium Well', price: 0, isDefault: false },
      { id: 'cook-w', name: 'Well Done', price: 0, isDefault: false },
    ],
  },
  {
    id: 'mod-cheese',
    name: 'Cheese',
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    modifiers: [
      { id: 'cheese-american', name: 'American Cheese', price: 0.99, isDefault: false },
      { id: 'cheese-swiss', name: 'Swiss Cheese', price: 0.99, isDefault: false },
      { id: 'cheese-pepperjack', name: 'Pepper Jack', price: 0.99, isDefault: false },
      { id: 'cheese-none', name: 'No Cheese', price: 0, isDefault: false },
    ],
  },
  {
    id: 'mod-eggstyle',
    name: 'Egg Style',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    modifiers: [
      { id: 'egg-scrambled', name: 'Scrambled', price: 0, isDefault: true },
      { id: 'egg-overeasy', name: 'Over Easy', price: 0, isDefault: false },
      { id: 'egg-overmedium', name: 'Over Medium', price: 0, isDefault: false },
      { id: 'egg-overhard', name: 'Over Hard', price: 0, isDefault: false },
      { id: 'egg-sunny', name: 'Sunny Side Up', price: 0, isDefault: false },
    ],
  },
  {
    id: 'mod-drinksize',
    name: 'Size',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    modifiers: [
      { id: 'size-sm', name: 'Small', price: 0, isDefault: false },
      { id: 'size-md', name: 'Medium', price: 0.5, isDefault: true },
      { id: 'size-lg', name: 'Large', price: 1.0, isDefault: false },
    ],
  },
  {
    id: 'mod-extras',
    name: 'Add Extras',
    isRequired: false,
    minSelect: 0,
    maxSelect: 5,
    modifiers: [
      { id: 'extra-bacon', name: 'Bacon', price: 2.49, calories: 120, isDefault: false },
      { id: 'extra-avocado', name: 'Avocado', price: 1.99, calories: 80, isDefault: false },
      { id: 'extra-egg', name: 'Fried Egg', price: 1.49, calories: 90, isDefault: false },
      { id: 'extra-patty', name: 'Extra Patty', price: 3.99, calories: 350, isDefault: false },
      { id: 'extra-rings', name: 'Onion Rings', price: 1.99, calories: 180, isDefault: false },
    ],
  },
];
