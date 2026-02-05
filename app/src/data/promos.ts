import { ImageSourcePropType } from 'react-native';

export type Promo = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  code?: string;
  terms?: string;
};

export const PROMOS: Promo[] = [
  {
    id: 'seafood-fest',
    title: 'Seafood Fest',
    description: 'Limited-time favorites with classic seafood plates.',
    image: require('../../assets/rewards/reward-08.png'),
    code: 'SEAFOOD',
    terms: 'Valid for a limited time at participating locations.',
  },
  {
    id: 'kids',
    title: 'Kids Promo',
    description: 'Family-friendly deals for little diners.',
    image: require('../../assets/rewards/reward-09.png'),
    terms: 'Offer varies by location.',
  },
  {
    id: 'birthday',
    title: 'Birthday Treat',
    description: 'Celebrate with a sweet reward.',
    image: require('../../assets/rewards/reward-10.png'),
    code: 'BIRTHDAY',
    terms: 'Valid once per member.',
  },
];
