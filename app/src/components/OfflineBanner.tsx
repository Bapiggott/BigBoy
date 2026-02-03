import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { useNetwork } from '../store';

interface OfflineBannerProps {
  message?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = 'You\'re offline. Some features may be limited.',
}) => {
  const { isOffline } = useNetwork();

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={16} color={colors.white} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.labelMedium,
    color: colors.white,
    fontWeight: '600',
  },
});

export default OfflineBanner;
