import { ImageSourcePropType } from 'react-native';

const DEFAULT_FALLBACK: ImageSourcePropType = require('../../assets/brand/bigboy-logo-modern.png');

export const getLocalImage = (
  source?: ImageSourcePropType | null,
  fallback?: ImageSourcePropType
): ImageSourcePropType => {
  if (typeof source === 'number') {
    return source;
  }
  return fallback ?? DEFAULT_FALLBACK;
};
