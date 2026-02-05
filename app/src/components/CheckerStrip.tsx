import React from 'react';
import { ImageBackground, StyleSheet, StyleProp, ViewStyle } from 'react-native';

const CHECKERS = require('../../assets/brand/bigboy-checkers-red.png');

type CheckerStripProps = {
  style?: StyleProp<ViewStyle>;
};

export const CheckerStrip: React.FC<CheckerStripProps> = ({ style }) => {
  return (
    <ImageBackground
      source={CHECKERS}
      style={[styles.strip, style]}
      imageStyle={styles.image}
      resizeMode="repeat"
    />
  );
};

const styles = StyleSheet.create({
  strip: {
    width: '100%',
    height: 16,
  },
  image: {
    opacity: 0.22,
  },
});

export default CheckerStrip;
