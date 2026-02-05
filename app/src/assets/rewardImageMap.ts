import { ImageSourcePropType } from 'react-native';
import { Reward } from '../types';

const REWARD_IMAGES: ImageSourcePropType[] = [
  require('../../assets/rewards/reward-01.png'),
  require('../../assets/rewards/reward-02.png'),
  require('../../assets/rewards/reward-03.png'),
  require('../../assets/rewards/reward-04.png'),
  require('../../assets/rewards/reward-05.png'),
  require('../../assets/rewards/reward-06.png'),
  require('../../assets/rewards/reward-07.png'),
  require('../../assets/rewards/reward-08.png'),
  require('../../assets/rewards/reward-09.png'),
  require('../../assets/rewards/reward-10.png'),
  require('../../assets/rewards/reward-11.png'),
  require('../../assets/rewards/reward-12.png'),
  require('../../assets/rewards/reward-13.png'),
  require('../../assets/rewards/reward-14.png'),
  require('../../assets/rewards/reward-15.png'),
  require('../../assets/rewards/reward-16.png'),
  require('../../assets/rewards/reward-17.png'),
];

export const REWARD_PLACEHOLDER = REWARD_IMAGES[0];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

export const getRewardImage = (reward: Pick<Reward, 'id' | 'name' | 'category' | 'imageUrl'>): ImageSourcePropType => {
  const key = reward.id || reward.name || reward.category || 'reward';
  const index = Math.abs(hashString(String(key))) % REWARD_IMAGES.length;
  return REWARD_IMAGES[index] ?? REWARD_PLACEHOLDER;
};

export default REWARD_IMAGES;
