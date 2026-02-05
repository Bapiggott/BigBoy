import { ImageSourcePropType } from 'react-native';

export type NewsItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  bullets: string[];
  categoryHint?: string;
};

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'seafood-fest',
    title: 'Seafood Fest is here!',
    subtitle: 'Limited-time seafood favorites are back.',
    image: require('../../assets/rewards/reward-05.png'),
    bullets: ['Shrimp basket', 'Fish & chips', 'Cod plate', 'Selection varies by location'],
    categoryHint: 'seafood',
  },
  {
    id: 'breaded-shrimp',
    title: 'Breaded Shrimp Basket',
    subtitle: 'Crispy, golden, and made to share.',
    image: require('../../assets/rewards/reward-06.png'),
    bullets: ['Basket style portions', 'Classic diner sides', 'Selection varies by location'],
    categoryHint: 'seafood',
  },
  {
    id: 'fish-cod',
    title: 'Fish & Cod Plate',
    subtitle: 'Classic comfort with a crunch.',
    image: require('../../assets/rewards/reward-07.png'),
    bullets: ['Cod plate', 'Fish & chips', 'Selection varies by location'],
    categoryHint: 'seafood',
  },
];
