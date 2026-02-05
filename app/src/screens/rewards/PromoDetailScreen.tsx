import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { brandTheme } from '../../theme/brand';
import { Button } from '../../components';
import { PROMOS } from '../../data/promos';
import { RewardsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RewardsStackParamList, 'PromoDetail'>;

const PromoDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const promo = PROMOS.find((p) => p.id === route.params.promoId);

  if (!promo) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Promo not found.</Text>
      </View>
    );
  }

  const handleCopy = async () => {
    if (!promo.code) return;
    await Clipboard.setStringAsync(promo.code);
    Alert.alert('Copied', 'Promo code copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={promo.image} style={styles.hero} resizeMode="cover" />
        <Text style={styles.title}>{promo.title}</Text>
        <Text style={styles.description}>{promo.description}</Text>

        {promo.code ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Promo code</Text>
            <Text style={styles.codeValue}>{promo.code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>No code needed</Text>
            <Text style={styles.codeValue}>Applied automatically</Text>
          </View>
        )}

        {promo.terms ? <Text style={styles.terms}>{promo.terms}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Back to Rewards" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandTheme.colors.cream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  codeBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  codeValue: {
    ...typography.titleLarge,
    color: brandTheme.colors.primary,
    marginBottom: spacing.sm,
  },
  copyButton: {
    backgroundColor: brandTheme.colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  copyText: {
    ...typography.labelMedium,
    color: colors.white,
    fontWeight: '700',
  },
  terms: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandTheme.colors.cream,
  },
  missingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

export default PromoDetailScreen;
