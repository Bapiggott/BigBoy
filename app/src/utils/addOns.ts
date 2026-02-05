import { MenuItem } from '../types';

export type AddOnOption = {
  name: string;
  priceAdjustment: number;
};

const ADD_ON_KEYWORDS = [
  'bacon',
  'egg',
  'cheese',
  'avocado',
  'mushroom',
  'jalapeno',
  'onion',
  'pickle',
  'extra',
  'add',
];

const isAddOnLabel = (label: string) => {
  const value = label.toLowerCase();
  return ADD_ON_KEYWORDS.some((keyword) => value.includes(keyword));
};

export const getAddOnOptions = (item?: MenuItem | null): AddOnOption[] => {
  if (!item?.modifierGroups?.length) return [];

  const options: AddOnOption[] = [];

  item.modifierGroups.forEach((group) => {
    if (group.isRequired) return;

    const groupMatches = isAddOnLabel(group.name ?? '');

    group.modifiers.forEach((modifier) => {
      const priceAdjustment = modifier.priceAdjustment ?? modifier.price ?? 0;
      if (priceAdjustment <= 0) return;

      const isAddOn = groupMatches || isAddOnLabel(modifier.name ?? '');
      if (!isAddOn) return;

      if (!options.find((existing) => existing.name === modifier.name)) {
        options.push({ name: modifier.name, priceAdjustment });
      }
    });
  });

  return options;
};
