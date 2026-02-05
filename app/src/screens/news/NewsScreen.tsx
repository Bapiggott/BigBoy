import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { brandTheme } from '../../theme/brand';
import { BrandedHeader, Button, Card } from '../../components';
import { getCategories } from '../../api';
import { RootTabParamList } from '../../navigation/types';

type Navigation = NativeStackNavigationProp<RootTabParamList>;

const SEAFOOD_COPY = {
  title: 'Seafood Fest is here!',
  body:
    'Limited-time seafood favorites are back—classics like Fish & Chips plus new items like Cod Sliders. Available at participating locations.',
  bullets: ['Fish & Chips', 'Cod Sliders', 'Seafood specials'],
};

const PROMOS = [
  { id: 'seafood', title: 'Seafood Fest', subtitle: 'Limited time favorites' },
  { id: 'kids', title: 'Kids Eat Happy', subtitle: 'Family-friendly specials' },
  { id: 'birthday', title: 'Birthday Treat', subtitle: 'Celebrate with a sweet reward' },
];

const NewsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const [showModal, setShowModal] = useState(false);

  const handleOrderNow = useCallback(async () => {
    try {
      const categories = await getCategories();
      const seafood = categories.find((category) => {
        const name = category.name?.toLowerCase() ?? '';
        const slug = category.slug?.toLowerCase() ?? '';
        return name.includes('seafood') || slug.includes('seafood');
      });

      navigation.navigate('MenuTab', {
        screen: 'Menu',
        params: seafood ? { categoryId: seafood.id } : undefined,
      });
    } catch {
      navigation.navigate('MenuTab', { screen: 'Menu' });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="News" promoLabel="Seafood" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard} variant="elevated">
          <Text style={styles.heroTitle}>{SEAFOOD_COPY.title}</Text>
          <Text style={styles.heroBody}>{SEAFOOD_COPY.body}</Text>

          <View style={styles.bulletRow}>
            {SEAFOOD_COPY.bullets.map((bullet) => (
              <View key={bullet} style={styles.bullet}>
                <Ionicons name="checkmark-circle" size={16} color={brandTheme.colors.primary} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroActions}>
            <Button title="Order Now" onPress={handleOrderNow} />
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.learnMore}>
              <Text style={styles.learnMoreText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>More Promos</Text>
        {PROMOS.map((promo) => (
          <Card key={promo.id} style={styles.promoCard} variant="outlined">
            <View style={styles.promoContent}>
              <View>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{SEAFOOD_COPY.title}</Text>
            <Text style={styles.modalBody}>{SEAFOOD_COPY.body}</Text>
            {SEAFOOD_COPY.bullets.map((bullet) => (
              <Text key={bullet} style={styles.modalBullet}>• {bullet}</Text>
            ))}
            <Button title="Close" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: brandTheme.colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  heroTitle: {
    ...typography.headlineSmall,
    color: brandTheme.colors.primary,
    marginBottom: spacing.sm,
  },
  heroBody: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  bulletRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  heroActions: {
    gap: spacing.sm,
  },
  learnMore: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    ...typography.labelLarge,
    color: brandTheme.colors.primary,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  promoCard: {
    padding: spacing.md,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  promoSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  modalBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  modalBullet: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});

export default NewsScreen;
