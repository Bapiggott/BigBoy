import { Reward, UserReward, LoyaltyTier } from '../types';

/**
 * Big Boy Rewards
 */
export const mockRewards: Reward[] = [
  // Food rewards
  {
    id: 'reward-1',
    name: 'Free French Fries',
    description: 'Enjoy a free order of our crispy golden fries',
    pointsCost: 150,
    category: 'food',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-2',
    name: 'Free Side Salad',
    description: 'Fresh mixed greens with your choice of dressing',
    pointsCost: 200,
    category: 'food',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-3',
    name: 'Free Onion Rings',
    description: 'Crispy beer-battered onion rings',
    pointsCost: 250,
    category: 'food',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-4',
    name: 'Free Chicken Tenders',
    description: 'Hand-breaded chicken tenders basket',
    pointsCost: 800,
    category: 'food',
    minTier: 'silver',
    isAvailable: true,
  },
  {
    id: 'reward-5',
    name: 'Free Big Boy Burger',
    description: 'Our signature double-decker burger',
    pointsCost: 1000,
    category: 'food',
    minTier: 'silver',
    isAvailable: true,
  },

  // Drink rewards
  {
    id: 'reward-10',
    name: 'Free Soft Drink',
    description: 'Any size fountain drink',
    pointsCost: 100,
    category: 'drink',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-11',
    name: 'Free Coffee',
    description: 'Hot brewed coffee, regular or decaf',
    pointsCost: 100,
    category: 'drink',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-12',
    name: 'Free Fresh Lemonade',
    description: 'Refreshing house-made lemonade',
    pointsCost: 175,
    category: 'drink',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-13',
    name: 'Free Milkshake',
    description: 'Any flavor thick and creamy shake',
    pointsCost: 350,
    category: 'drink',
    minTier: 'silver',
    isAvailable: true,
  },

  // Dessert rewards
  {
    id: 'reward-20',
    name: 'Free Apple Pie',
    description: 'Warm apple pie à la mode',
    pointsCost: 300,
    category: 'dessert',
    minTier: 'bronze',
    isAvailable: true,
  },
  {
    id: 'reward-21',
    name: 'Free Strawberry Shortcake',
    description: 'Classic strawberry shortcake',
    pointsCost: 400,
    category: 'dessert',
    minTier: 'silver',
    isAvailable: true,
  },
  {
    id: 'reward-22',
    name: 'Free Hot Fudge Cake',
    description: 'Our famous hot fudge sundae cake',
    pointsCost: 500,
    category: 'dessert',
    minTier: 'silver',
    isAvailable: true,
  },

  // Combo rewards
  {
    id: 'reward-30',
    name: 'Free Breakfast Combo',
    description: 'Big Boy Breakfast with coffee',
    pointsCost: 900,
    category: 'combo',
    minTier: 'silver',
    isAvailable: true,
  },
  {
    id: 'reward-31',
    name: 'Free Burger Combo',
    description: 'Any burger with fries and drink',
    pointsCost: 1200,
    category: 'combo',
    minTier: 'gold',
    isAvailable: true,
  },
  {
    id: 'reward-32',
    name: 'Birthday Meal',
    description: 'Free entrée on your birthday (up to $20 value)',
    pointsCost: 0,
    category: 'combo',
    minTier: 'bronze',
    isAvailable: true,
  },

  // Merchandise
  {
    id: 'reward-40',
    name: 'Big Boy T-Shirt',
    description: 'Classic Big Boy logo t-shirt',
    pointsCost: 2000,
    category: 'merchandise',
    minTier: 'gold',
    isAvailable: true,
  },
  {
    id: 'reward-41',
    name: 'Big Boy Coffee Mug',
    description: 'Ceramic Big Boy coffee mug',
    pointsCost: 1500,
    category: 'merchandise',
    minTier: 'gold',
    isAvailable: true,
  },
];

/**
 * Loyalty Tier Definitions
 */
export const loyaltyTiers: Record<LoyaltyTier, {
  name: string;
  minPoints: number;
  pointsMultiplier: number;
  benefits: string[];
}> = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    pointsMultiplier: 1.0,
    benefits: [
      'Earn 10 points per dollar',
      'Free birthday reward',
      'Exclusive member offers',
    ],
  },
  silver: {
    name: 'Silver',
    minPoints: 1000,
    pointsMultiplier: 1.25,
    benefits: [
      'Earn 12.5 points per dollar (25% bonus)',
      'Free birthday reward',
      'Priority seating',
      'Early access to promotions',
    ],
  },
  gold: {
    name: 'Gold',
    minPoints: 5000,
    pointsMultiplier: 1.5,
    benefits: [
      'Earn 15 points per dollar (50% bonus)',
      'Free birthday reward + dessert',
      'Priority seating',
      'Free delivery',
      'Exclusive merchandise rewards',
    ],
  },
};

/**
 * Mock user rewards (for offline mode)
 */
export const mockUserRewards: UserReward[] = [];
