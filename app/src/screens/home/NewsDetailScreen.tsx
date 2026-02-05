import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { brandTheme } from '../../theme/brand';
import { BrandedHeader, Button, CheckerStrip } from '../../components';
import { NEWS_ITEMS } from '../../data/news';
import { getLocalImage } from '../../utils/images';
import { getCategories } from '../../api';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'NewsDetail'>;

const NewsDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId } = route.params;
  const newsItem = NEWS_ITEMS.find((item) => item.id === newsId);

  const handleOrderNow = async () => {
    const categoryHint = newsItem?.categoryHint;
    if (!categoryHint) {
      navigation.navigate('MenuTab', { screen: 'Menu' });
      return;
    }

    try {
      const categories = await getCategories();
      const normalized = categoryHint.toLowerCase();
      const match = categories.find((category) => {
        const name = category.name?.toLowerCase() ?? '';
        const slug = category.slug?.toLowerCase() ?? '';
        return name.includes(normalized) || slug.includes(normalized);
      });

      navigation.navigate('MenuTab', {
        screen: 'Menu',
        params: match ? { categoryId: match.id } : undefined,
      });
    } catch {
      navigation.navigate('MenuTab', { screen: 'Menu' });
    }
  };

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <BrandedHeader title="News" />
        <CheckerStrip />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Promo not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrandedHeader title="News" />
      <CheckerStrip />

      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground
          source={getLocalImage(newsItem.image)}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>LIMITED TIME</Text>
            </View>
            <Text style={styles.heroTitle}>{newsItem.title}</Text>
            <Text style={styles.heroSubtitle}>{newsItem.subtitle}</Text>
          </View>
        </ImageBackground>

        <CheckerStrip style={styles.sectionDivider} />

        <View style={styles.bodySection}>
          <Text style={styles.sectionTitle}>What’s Included</Text>
          {newsItem.bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={brandTheme.colors.primary} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
          <Text style={styles.noteText}>Selection varies by location.</Text>
        </View>

        <View style={styles.ctaSection}>
          <Button title="Order Now" onPress={handleOrderNow} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandTheme.colors.cream,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: borderRadius.lg,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: spacing.xs,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: brandTheme.colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    ...typography.labelSmall,
    color: brandTheme.colors.dark,
    fontWeight: '700',
  },
  heroTitle: {
    ...typography.titleLarge,
    color: colors.white,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.white,
  },
  sectionDivider: {
    marginTop: spacing.sm,
  },
  bodySection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: brandTheme.colors.dark,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  ctaSection: {
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

export default NewsDetailScreen;
