import { ImageSourcePropType } from 'react-native';
import { Reward } from '../types';

// Canonical rewards asset folder: app/assets/rewards
export const REWARD_IMAGES = {
  dessert: require('../../assets/rewards/reward-dessert.png'),
  fries: require('../../assets/rewards/reward-fries.png'),
  salad: require('../../assets/rewards/reward-salad.png'),
  placeholder: require('../../assets/rewards/reward-placeholder.png'),
} as const;

export const getRewardImage = (reward: Reward): ImageSourcePropType => {
  const name = reward.name.toLowerCase();

  if (name.includes('fries')) return REWARD_IMAGES.fries;
  if (name.includes('salad')) return REWARD_IMAGES.salad;
  if (reward.category === 'dessert' || name.includes('cake') || name.includes('pie') || name.includes('dessert')) {
    return REWARD_IMAGES.dessert;
  }

  return REWARD_IMAGES.placeholder;
};

export const REWARD_PLACEHOLDER = REWARD_IMAGES.placeholder;
