import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { BrandedHeader, Button, CheckerStrip, OfflineBanner, LocationPickerModal } from '../../components';
import { useLocation } from '../../store';
import { MenuItem } from '../../types';
import { getCategories, getNewItems, getPopularItems } from '../../api';
import { getMenuSource } from '../../api/endpoints/menu';
import { NEWS_ITEMS } from '../../data/news';
import { mockLocations } from '../../data/mockLocations';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

const BANNER_IMAGE = require('../../../assets/banners/bigboy-banner.png');
const BRAND_LOGO = require('../../../assets/brand/bigboy-logo-modern.png');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const { selectedLocation, locations, selectLocation } = useLocation();

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [newItems, setNewItems] = useState<MenuItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [menuSource, setMenuSource] = useState<'api' | 'mock'>('api');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const availableLocations = useMemo(
    () => (locations.length ? locations : mockLocations),
    [locations]
  );

  const locationId = selectedLocation?.id ?? '';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [items, popular] = await Promise.all([
        getNewItems(locationId),
        getPopularItems(locationId),
      ]);
      setNewItems(items.slice(0, 6));
      setFeaturedItems((popular.length ? popular : items).slice(0, 6));
      setMenuSource(getMenuSource());
    } catch (error) {
      console.error('[Home] Failed to load new items:', error);
      setErrorMessage('Failed to load menu items.');
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleOrderNow = () => {
    navigation.navigate('MenuTab', { screen: 'Menu', params: { initialCategoryId: 'all' }, merge: true });
  };

  const handleNewsPress = (newsId: string) => {
    navigation.navigate('NewsDetail', { newsId });
  };

  const handlePromoOrderNow = async (categoryHint?: string) => {
    if (!categoryHint) {
      navigation.navigate('MenuTab', { screen: 'Menu', params: { initialCategoryId: 'all' }, merge: true });
      return;
    }

    try {
      const categories = await getCategories(locationId);
      const normalized = categoryHint.toLowerCase();
      const match = categories.find((category) => {
        const name = category.name?.toLowerCase() ?? '';
        const slug = category.slug?.toLowerCase() ?? '';
        return name.includes(normalized) || slug.includes(normalized);
      });

      navigation.navigate('MenuTab', {
        screen: 'Menu',
        params: { initialCategoryId: match?.id ?? 'all' },
        merge: true,
      });
    } catch {
      navigation.navigate('MenuTab', { screen: 'Menu', params: { initialCategoryId: 'all' }, merge: true });
    }
  };

  const handleSelectLocation = async (location: typeof availableLocations[number]) => {
    await selectLocation(location);
    setLocationModalVisible(false);
  };

  const handleLogoPress = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const normalizePrice = (price: number) => {
    if (!Number.isFinite(price)) return 0;
    if (price >= 1000) return price / 100;
    if (price >= 100 && Number.isInteger(price)) return price / 100;
    return price;
  };
  const formatPrice = (price: number) => `$${normalizePrice(price).toFixed(2)}`;

  const LocationPill = (
    <TouchableOpacity
      style={styles.locationPill}
      onPress={() => setLocationModalVisible(true)}
      accessibilityRole="button"
      accessibilityLabel="Select location"
    >
      <Ionicons name="location" size={14} color={colors.primary.main} />
      <Text style={styles.locationPillText} numberOfLines={1}>
        {selectedLocation?.name || 'Select location'}
      </Text>
      <Ionicons name="chevron-down" size={14} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderNewsCard = ({ item }: { item: typeof NEWS_ITEMS[number] }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => handleNewsPress(item.id)}
      activeOpacity={0.9}
    >
      <ImageBackground source={item.image} style={styles.newsImage} imageStyle={styles.newsImageStyle}>
        <View style={styles.newsOverlay}>
          <Text style={styles.newsBadge}>LIMITED TIME</Text>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <Text style={styles.newsSubtitle}>{item.subtitle}</Text>
          <TouchableOpacity
            style={styles.newsCta}
            onPress={() => handlePromoOrderNow(item.categoryHint)}
            accessibilityRole="button"
            accessibilityLabel={`Order now for ${item.title}`}
          >
            <Text style={styles.newsCtaText}>Order Now</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const handleOpenMenuItem = (itemId: string) => {
    navigation.navigate('MenuTab', { screen: 'Menu', params: { initialCategoryId: 'all' }, merge: true });
    requestAnimationFrame(() => {
      navigation.navigate('MenuTab', { screen: 'MenuItemDetail', params: { itemId } });
    });
  };

  const renderNewItemCard = (item: MenuItem) => {
    const resolved = resolveMenuImage(item);
    const imageSource = failedImages[item.id] ? MENU_IMAGE_PLACEHOLDER : resolved.source;
    const isPlaceholder = failedImages[item.id] || imageSource === MENU_IMAGE_PLACEHOLDER;
    return (
      <TouchableOpacity
        style={styles.newItemCard}
        onPress={() => handleOpenMenuItem(item.id)}
      >
        <View style={styles.newItemImageWrap}>
          <Image
            source={imageSource}
            style={styles.newItemImage}
            resizeMode={isPlaceholder ? 'contain' : 'cover'}
            onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
          />
        </View>
        <View style={styles.newItemInfo}>
          <Text style={styles.newItemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.newItemPrice}>{formatPrice(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const placeholderItems = [
    { key: 'ph-1', title: 'Classic Big Boy', price: '$9.99' },
    { key: 'ph-2', title: 'Strawberry Shake', price: '$5.49' },
    { key: 'ph-3', title: 'Fish & Chips', price: '$11.99' },
    { key: 'ph-4', title: 'Shrimp Basket', price: '$10.49' },
    { key: 'ph-5', title: 'Seafood Fest', price: '$12.99' },
    { key: 'ph-6', title: 'Burger Combo', price: '$10.99' },
  ];

  const placeholderCards = placeholderItems.map((item) => (
    <View key={item.key} style={styles.newItemCard}>
      <View style={styles.newItemImageWrap}>
        <Image source={BRAND_LOGO} style={styles.newItemImage} resizeMode="contain" />
      </View>
      <View style={styles.newItemInfo}>
        <Text style={styles.newItemName}>{item.title}</Text>
        <Text style={styles.newItemPrice}>{item.price}</Text>
      </View>
    </View>
  ));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />
      <BrandedHeader
        onLogoPress={handleLogoPress}
        centerSlot={LocationPill}
      />
      <CheckerStrip />

      <LocationPickerModal
        visible={isLocationModalVisible}
        locations={availableLocations}
        selectedId={selectedLocation?.id}
        onClose={() => setLocationModalVisible(false)}
        onSelect={handleSelectLocation}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <ImageBackground source={BANNER_IMAGE} style={styles.banner} imageStyle={styles.bannerImage}>
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Big Boy</Text>
            <Text style={styles.bannerSubtitle}>Classic diner favorites, ready to order.</Text>
            <Button title="Order Now" onPress={handleOrderNow} />
          </View>
        </ImageBackground>

        <CheckerStrip style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>News</Text>
        </View>

        <FlatList
          data={NEWS_ITEMS}
          keyExtractor={(item) => item.id ?? item.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderNewsCard}
        />

        <CheckerStrip style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Items</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MenuTab')}>
            <Text style={styles.sectionAction}>See Menu</Text>
          </TouchableOpacity>
        </View>

        {menuSource === 'mock' && (
          <View style={styles.mockBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.mockBannerText}>Offline mode (menu from mock)</Text>
          </View>
        )}

        {errorMessage ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>{errorMessage}</Text>
          </View>
        ) : isLoading && newItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Loading menu...</Text>
          </View>
        ) : (
          <View>
            {newItems.length > 0 ? (
              <FlatList
                data={newItems}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newItemsRow}
                renderItem={({ item }) => renderNewItemCard(item)}
              />
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newItemsRow}>
                  {placeholderCards}
                </ScrollView>
                <TouchableOpacity style={styles.tryAgainButton} onPress={fetchData}>
                  <Text style={styles.tryAgainText}>Try again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <CheckerStrip style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Items</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MenuTab', { screen: 'Menu', params: { initialCategoryId: 'all' }, merge: true })
            }
          >
            <Text style={styles.sectionAction}>See Menu</Text>
          </TouchableOpacity>
        </View>

        {featuredItems.length > 0 ? (
          <FlatList
            data={featuredItems}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newItemsRow}
            renderItem={({ item }) => renderNewItemCard(item)}
          />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newItemsRow}>
              {placeholderCards}
            </ScrollView>
            <TouchableOpacity style={styles.tryAgainButton} onPress={fetchData}>
              <Text style={styles.tryAgainText}>Try again</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  banner: { height: 200, borderRadius: borderRadius.lg, overflow: 'hidden' },
  bannerImage: { borderRadius: borderRadius.lg },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: spacing.sm,
  },
  bannerTitle: { ...typography.headlineSmall, color: colors.white },
  bannerSubtitle: { ...typography.bodyMedium, color: colors.white },
  sectionDivider: { marginTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.titleLarge, color: colors.text.primary },
  sectionAction: { ...typography.labelLarge, color: colors.primary.main },
  newsCard: { width: 320, marginRight: spacing.md },
  newsImage: { height: 180, borderRadius: borderRadius.lg, overflow: 'hidden' },
  newsImageStyle: { borderRadius: borderRadius.lg },
  newsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  newsBadge: {
    ...typography.labelSmall,
    color: colors.white,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  newsTitle: { ...typography.titleMedium, color: colors.white },
  newsSubtitle: { ...typography.bodySmall, color: colors.white },
  newsCta: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
  },
  newsCtaText: { ...typography.labelSmall, color: colors.white, fontWeight: '700' },
  newItemsRow: { gap: spacing.md, paddingRight: spacing.lg },
  newItemCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  newItemImageWrap: {
    height: 110,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newItemImage: { width: '100%', height: 110 },
  newItemInfo: { padding: spacing.md },
  newItemName: { ...typography.titleSmall, color: colors.text.primary, marginBottom: spacing.xs },
  newItemPrice: { ...typography.labelLarge, color: colors.primary.main, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  emptyText: { ...typography.bodyMedium, color: colors.text.secondary },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  mockBannerText: { ...typography.bodySmall, color: colors.text.secondary },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    maxWidth: 170,
  },
  locationPillText: { ...typography.labelMedium, color: colors.text.primary, maxWidth: 120 },
  tryAgainButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  tryAgainText: {
    ...typography.labelSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
