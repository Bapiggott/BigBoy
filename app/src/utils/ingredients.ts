import { MenuItem } from '../types';

const DEFAULT_INGREDIENTS = {
  burger: ['Lettuce', 'Tomato', 'Onion', 'Pickles', 'Cheese', 'Sauce'],
  sandwich: ['Lettuce', 'Tomato', 'Onion', 'Cheese', 'Sauce'],
  salad: ['Lettuce', 'Tomato', 'Onion', 'Croutons', 'Cheese'],
  breakfast: ['Egg', 'Cheese', 'Sausage', 'Bacon'],
  dessert: ['Whipped Cream', 'Chocolate Drizzle'],
  sides: ['Salt', 'Sauce'],
  default: ['Lettuce', 'Tomato', 'Onion', 'Pickles'],
} as const;

const normalize = (value?: string | null) => value?.toLowerCase() ?? '';

export const getIngredientOptions = (item?: Partial<MenuItem> & { categoryName?: string }): string[] => {
  if (!item) return [...DEFAULT_INGREDIENTS.default];

  const explicit = item.ingredients?.filter(Boolean);
  if (explicit && explicit.length > 0) {
    return Array.from(new Set(explicit));
  }

  const categoryName = normalize(item.category?.name ?? item.categoryName ?? '');
  const categorySlug = normalize(item.category?.slug ?? '');
  const name = normalize(item.name ?? '');

  const match = `${categoryName} ${categorySlug} ${name}`;

  if (match.includes('burger')) return [...DEFAULT_INGREDIENTS.burger];
  if (match.includes('sandwich') || match.includes('wrap')) return [...DEFAULT_INGREDIENTS.sandwich];
  if (match.includes('salad') || match.includes('soup')) return [...DEFAULT_INGREDIENTS.salad];
  if (match.includes('breakfast') || match.includes('omelet')) return [...DEFAULT_INGREDIENTS.breakfast];
  if (match.includes('dessert') || match.includes('shake') || match.includes('ice cream')) {
    return [...DEFAULT_INGREDIENTS.dessert];
  }
  if (match.includes('fries') || match.includes('side')) return [...DEFAULT_INGREDIENTS.sides];

  return [...DEFAULT_INGREDIENTS.default];
};
