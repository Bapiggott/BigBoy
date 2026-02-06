import { ImageSourcePropType } from 'react-native';
import { MenuItem } from '../types';

const LOCAL_MENU_IMAGES: Record<string, ImageSourcePropType> = {
  'big-boy.png': require('../../assets/menu_images_fixed/big-boy.png'),
  'fresh-lemonade.jpg': require('../../assets/menu_images_fixed/fresh-lemonade.jpg'),
  'fries.png': require('../../assets/menu_images_fixed/fries.png'),
  'iced-tea.jpg': require('../../assets/menu_images_fixed/iced-tea.jpg'),
  'item-1.jpg': require('../../assets/menu_images_fixed/item-1.jpg'),
  'item-10.jpg': require('../../assets/menu_images_fixed/item-10.jpg'),
  'item-11.jpg': require('../../assets/menu_images_fixed/item-11.jpg'),
  'item-12.jpg': require('../../assets/menu_images_fixed/item-12.jpg'),
  'item-13.jpg': require('../../assets/menu_images_fixed/item-13.jpg'),
  'item-14.jpg': require('../../assets/menu_images_fixed/item-14.jpg'),
  'item-15.jpg': require('../../assets/menu_images_fixed/item-15.jpg'),
  'item-16.jpg': require('../../assets/menu_images_fixed/item-16.jpg'),
  'item-17.jpg': require('../../assets/menu_images_fixed/item-17.jpg'),
  'item-18.jpg': require('../../assets/menu_images_fixed/item-18.jpg'),
  'item-19.jpg': require('../../assets/menu_images_fixed/item-19.jpg'),
  'item-2.jpg': require('../../assets/menu_images_fixed/item-2.jpg'),
  'item-20.jpg': require('../../assets/menu_images_fixed/item-20.jpg'),
  'item-21.jpg': require('../../assets/menu_images_fixed/item-21.jpg'),
  'item-22.jpg': require('../../assets/menu_images_fixed/item-22.jpg'),
  'item-23.jpg': require('../../assets/menu_images_fixed/item-23.jpg'),
  'item-24.jpg': require('../../assets/menu_images_fixed/item-24.jpg'),
  'item-25.jpg': require('../../assets/menu_images_fixed/item-25.jpg'),
  'item-26.jpg': require('../../assets/menu_images_fixed/item-26.jpg'),
  'item-27.jpg': require('../../assets/menu_images_fixed/item-27.jpg'),
  'item-28.jpg': require('../../assets/menu_images_fixed/item-28.jpg'),
  'item-29.jpg': require('../../assets/menu_images_fixed/item-29.jpg'),
  'item-3.jpg': require('../../assets/menu_images_fixed/item-3.jpg'),
  'item-30.jpg': require('../../assets/menu_images_fixed/item-30.jpg'),
  'item-31.jpg': require('../../assets/menu_images_fixed/item-31.jpg'),
  'item-32.jpg': require('../../assets/menu_images_fixed/item-32.jpg'),
  'item-33.jpg': require('../../assets/menu_images_fixed/item-33.jpg'),
  'item-34.jpg': require('../../assets/menu_images_fixed/item-34.jpg'),
  'item-35.jpg': require('../../assets/menu_images_fixed/item-35.jpg'),
  'item-4.jpg': require('../../assets/menu_images_fixed/item-4.jpg'),
  'item-40.jpg': require('../../assets/menu_images_fixed/item-40.jpg'),
  'item-41.jpg': require('../../assets/menu_images_fixed/item-41.jpg'),
  'item-42.jpg': require('../../assets/menu_images_fixed/item-42.jpg'),
  'item-43.jpg': require('../../assets/menu_images_fixed/item-43.jpg'),
  'item-5.jpg': require('../../assets/menu_images_fixed/item-5.jpg'),
  'item-50.jpg': require('../../assets/menu_images_fixed/item-50.jpg'),
  'item-51.jpg': require('../../assets/menu_images_fixed/item-51.jpg'),
  'item-52.jpg': require('../../assets/menu_images_fixed/item-52.jpg'),
  'item-53.jpg': require('../../assets/menu_images_fixed/item-53.jpg'),
  'item-54.jpg': require('../../assets/menu_images_fixed/item-54.jpg'),
  'item-6.jpg': require('../../assets/menu_images_fixed/item-6.jpg'),
  'item-60.jpg': require('../../assets/menu_images_fixed/item-60.jpg'),
  'item-61.jpg': require('../../assets/menu_images_fixed/item-61.jpg'),
  'item-62.jpg': require('../../assets/menu_images_fixed/item-62.jpg'),
  'item-63.jpg': require('../../assets/menu_images_fixed/item-63.jpg'),
  'item-7.jpg': require('../../assets/menu_images_fixed/item-7.jpg'),
  'item-70.jpg': require('../../assets/menu_images_fixed/item-70.jpg'),
  'item-71.jpg': require('../../assets/menu_images_fixed/item-71.jpg'),
  'item-72.jpg': require('../../assets/menu_images_fixed/item-72.jpg'),
  'item-73.jpg': require('../../assets/menu_images_fixed/item-73.jpg'),
  'item-74.jpg': require('../../assets/menu_images_fixed/item-74.jpg'),
  'item-8.jpg': require('../../assets/menu_images_fixed/item-8.jpg'),
  'item-9.jpg': require('../../assets/menu_images_fixed/item-9.jpg'),
  'orange-juice.jpg': require('../../assets/menu_images_fixed/orange-juice.jpg'),
  'placeholder.jpg': require('../../assets/menu_images_fixed/placeholder.jpg'),
  'placeholder.png': require('../../assets/menu_images_fixed/placeholder.png'),
  'salad.png': require('../../assets/menu_images_fixed/salad.png'),
  'shake.png': require('../../assets/menu_images_fixed/shake.png'),
  'soft-drink.jpg': require('../../assets/menu_images_fixed/soft-drink.jpg'),
};

const BRAND_PLACEHOLDER = require('../../assets/brand/bigboy-logo-modern.png');

export const MENU_IMAGE_PLACEHOLDER =
  BRAND_PLACEHOLDER ??
  LOCAL_MENU_IMAGES['placeholder.png'] ??
  LOCAL_MENU_IMAGES['placeholder.jpg'] ??
  LOCAL_MENU_IMAGES['big-boy.png'] ??
  Object.values(LOCAL_MENU_IMAGES)[0];

export type ResolvedMenuImage = {
  type: 'local' | 'remote';
  source: ImageSourcePropType;
};

export const resolveMenuImage = (item?: Pick<MenuItem, 'imageUrl' | 'image'>): ResolvedMenuImage => {
  const raw = (item?.imageUrl || item?.image || '').trim();
  if (!raw) {
    return { type: 'local', source: MENU_IMAGE_PLACEHOLDER };
  }
  if (/^https?:\/\//i.test(raw)) {
    return { type: 'remote', source: { uri: raw } };
  }
  const local = LOCAL_MENU_IMAGES[raw];
  if (local) {
    return { type: 'local', source: local };
  }
  return { type: 'local', source: MENU_IMAGE_PLACEHOLDER };
};

export const resolveItemImage = (item?: Pick<MenuItem, 'imageUrl' | 'image'>): ImageSourcePropType =>
  resolveMenuImage(item).source;
