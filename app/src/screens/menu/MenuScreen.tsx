import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Image,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useLocation } from '../../store';
import { BrandedHeader, CheckerStrip, Card, OfflineBanner } from '../../components';
import { getCategories, getMenuItems, searchMenuItems } from '../../api';
import { getMenuSource } from '../../api/endpoints/menu';
import { API_BASE_URL } from '../../config';
import { MenuCategory, MenuItem } from '../../types';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

const MENU_PLACEHOLDER_IMAGES = [
  require('../../../assets/brand/bigboy-logo-modern.png'),
];

type MenuStackParamList = {
  Menu: { categoryId?: string; initialCategoryId?: string };
  MenuItemDetail: { itemId: string };
  Cart: undefined;
};

type Props = NativeStackScreenProps<MenuStackParamList, 'Menu'>;

const MenuItemImage: React.FC<{ item: MenuItem; style?: StyleProp<ImageStyle> }> = ({ item, style }) => {
  const resolved = resolveMenuImage(item);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [item.id, item.imageUrl, item.image]);

  const isPlaceholder = failed || resolved.source === MENU_IMAGE_PLACEHOLDER;

  return (
    <Image
      source={failed ? MENU_IMAGE_PLACEHOLDER : resolved.source}
      style={style}
      resizeMode={isPlaceholder ? 'contain' : 'cover'}
      onError={() => setFailed(true)}
    />
  );
};

const MenuScreen: React.FC<Props> = ({ navigation, route }) => {
  const { selectedLocation } = useLocation();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuSource, setMenuSource] = useState<'api' | 'mock'>('api');
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const lastAppliedParam = useRef<string | null>(null);

  const categoryTabs = useMemo(
    () => [{ id: 'all', name: 'All' } as const, ...categories],
    [categories]
  );

  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
    const healthUrl = `${serverBase}/health`;

    if (__DEV__) {
      console.log('[Menu] Network Debug', { baseUrl: API_BASE_URL, healthUrl });
    }

    try {
      const response = await fetch(healthUrl);
      if (__DEV__) {
        console.log('[Menu] Health check result', { status: response.status });
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setHealthStatus('ok');
      setHealthMessage(null);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.log('[Menu] Health check failed', error);
      }
      setHealthStatus('error');
      setHealthMessage(`Can't reach server at ${serverBase}. Using offline menu.`);
      return false;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await checkServerHealth();
      const locationId = typeof selectedLocation === 'string'
        ? selectedLocation
        : selectedLocation?.id ?? '';

      if (__DEV__) {
        const categoriesEndpoint = `/menu/categories${locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''}`;
        const itemsEndpoint = `/menu/items${locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''}`;
        console.log('[Menu] Fetching', {
          baseUrl: API_BASE_URL,
          locationId,
          categoriesEndpoint,
          itemsEndpoint,
        });
      }

      const [cats, items] = await Promise.all([
        getCategories(locationId || undefined),
        getMenuItems(locationId || undefined),
      ]);
      const filteredCategories = cats.filter(
        (category) =>
          category.id !== 'cat-current-promotion' &&
          category.slug !== 'current-promotion' &&
          category.name !== 'Current Promotion'
      );
      const filteredItems = items.filter(
        (item) =>
          item.categoryId !== 'cat-current-promotion' &&
          item.category?.slug !== 'current-promotion' &&
          item.category?.name !== 'Current Promotion'
      );
      setCategories(filteredCategories);
      setMenuItems(filteredItems);
      setMenuSource(getMenuSource());

      if (__DEV__) {
        const payload = JSON.stringify({ categories: filteredCategories, items: filteredItems }, null, 2).slice(0, 800);
        console.log('[Menu] Response preview', payload);
      }

    } catch (error) {
      console.error('Failed to load menu:', error);
      setErrorMessage('Failed to load menu.');
    } finally {
      setIsLoading(false);
    }
  }, [checkServerHealth, route.params?.categoryId, selectedLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const paramCategory = route.params?.initialCategoryId ?? route.params?.categoryId;
    if (!paramCategory) return;

    if (paramCategory === 'cat-current-promotion' || paramCategory === 'current-promotion') {
      setSelectedCategory('all');
      navigation.setParams({ categoryId: undefined, initialCategoryId: undefined });
      return;
    }

    if (paramCategory !== lastAppliedParam.current) {
      setSelectedCategory(paramCategory);
      setSearchQuery('');
      lastAppliedParam.current = paramCategory;
      navigation.setParams({ categoryId: undefined, initialCategoryId: undefined });
    }
  }, [navigation, route.params?.categoryId, route.params?.initialCategoryId]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    const trimmed = query.trim();
    if (trimmed.length > 2) {
      try {
        const results = await searchMenuItems(trimmed);
        setMenuItems(results);
        setSelectedCategory('search');
        setMenuSource(getMenuSource());
      } catch (error) {
        console.error('Search failed:', error);
      }
      return;
    }

    if (trimmed.length === 0) {
      try {
        const locationId = typeof selectedLocation === 'string'
          ? selectedLocation
          : selectedLocation?.id ?? '';
        const items = await getMenuItems(locationId || undefined);
        setMenuItems(items);
        setSelectedCategory('all');
        setMenuSource(getMenuSource());
      } catch (error) {
        console.error('Failed to reset menu:', error);
      }
    }
  }, [selectedLocation]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'search') return menuItems;
    return menuItems.filter((item) => item.categoryId === selectedCategory);
  }, [menuItems, selectedCategory]);

  const normalizePrice = (price: number) => {
    if (!Number.isFinite(price)) return 0;
    if (price >= 1000) return price / 100;
    if (price >= 100 && Number.isInteger(price)) return price / 100;
    return price;
  };
  const formatPrice = (price: number) => `$${normalizePrice(price).toFixed(2)}`;

  const renderCategoryTab = ({ item }: { item: { id: string; name: string } }) => {
    const isActive = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => {
          setSelectedCategory(item.id);
          setSearchQuery('');
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    return (
      <Card
        style={styles.menuItemCard}
        onPress={() => navigation.navigate('MenuItemDetail', { itemId: item.id })}
        variant="elevated"
        padding="none"
      >
        <View style={styles.imageWrap}>
          <MenuItemImage item={item} style={styles.image} />

          {item.isPopular && (
            <View style={[styles.badge, styles.badgePopular]}>
              <Text style={styles.badgeText}>Popular</Text>
            </View>
          )}
          {item.isNew && (
            <View style={[styles.badge, styles.badgeNew]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>

        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.menuItemDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.menuItemFooter}>
            <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
            {item.calories ? (
              <Text style={styles.menuItemCalories}>{item.calories} cal</Text>
            ) : (
              <Text style={styles.menuItemCalories}> </Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const placeholderItems = [
    { id: 'ph-1', name: 'Classic Big Boy', price: 9.99, image: MENU_PLACEHOLDER_IMAGES[0] },
    { id: 'ph-2', name: 'Strawberry Shake', price: 5.49, image: MENU_PLACEHOLDER_IMAGES[0] },
    { id: 'ph-3', name: 'Fish & Chips', price: 11.99, image: MENU_PLACEHOLDER_IMAGES[0] },
    { id: 'ph-4', name: 'Shrimp Basket', price: 10.49, image: MENU_PLACEHOLDER_IMAGES[0] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />
      <BrandedHeader title="Menu" />
      <CheckerStrip />

      <View style={styles.header}>
        {selectedLocation && (
          <Text style={styles.locationText}>Ordering from {selectedLocation.name}</Text>
        )}
        {!selectedLocation && (
          <View style={styles.mockBanner}>
            <Ionicons name="location" size={16} color={colors.text.secondary} />
            <Text style={styles.mockBannerText}>Select a location to see menu</Text>
          </View>
        )}

        {selectedCategory !== 'all' && selectedCategory !== 'search' && (
          <TouchableOpacity
            style={styles.clearFilter}
            onPress={() => setSelectedCategory('all')}
            accessibilityRole="button"
            accessibilityLabel="Clear category filter"
          >
            <Ionicons name="close" size={14} color={colors.text.primary} />
            <Text style={styles.clearFilterText}>Clear filter</Text>
          </TouchableOpacity>
        )}

        {menuSource === 'mock' && (
          <View style={styles.mockBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.mockBannerText}>
              {healthStatus === 'error'
                ? healthMessage ?? 'Can\'t reach server. Using offline menu.'
                : 'Using offline menu (API error)'}
            </Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        horizontal
        data={categoryTabs}
        renderItem={renderCategoryTab}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesList}
      />

      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.menuItemsRow}
        contentContainerStyle={styles.menuItemsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={44} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>
              {isLoading
                ? 'Loading menu...'
                : errorMessage
                  ? 'Failed to load menu'
                  : 'No items available for this location'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryText}>Reload menu</Text>
            </TouchableOpacity>
            <View style={styles.placeholderGrid}>
              {placeholderItems.map((item) => (
                <View key={item.id} style={styles.placeholderCard}>
                  <Image source={item.image} style={styles.placeholderImage} resizeMode="contain" />
                  <View style={styles.placeholderInfo}>
                    <Text style={styles.placeholderName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.placeholderPrice}>{formatPrice(item.price)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: { ...typography.headlineMedium, color: colors.text.primary },

  locationText: { ...typography.labelMedium, color: colors.text.secondary, marginBottom: spacing.md },
  clearFilter: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warmGray,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  clearFilterText: {
    ...typography.labelSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  mockBannerText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.warmGray,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  retryText: {
    ...typography.labelSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, ...typography.bodyMedium, color: colors.text.primary },
  clearBtn: { paddingLeft: spacing.sm },

  categoriesList: { backgroundColor: colors.background },
  categoriesContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  categoryTab: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary.main,
    justifyContent: 'center',
  },
  categoryTabActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  categoryTabText: {
    ...typography.labelMedium,
    color: colors.primary.main,
    fontWeight: '600',
    lineHeight: typography.labelMedium.lineHeight,
    maxWidth: 160,
  },
  categoryTabTextActive: { color: colors.white, fontWeight: '700' },

  menuItemsContainer: { padding: spacing.lg, paddingTop: spacing.sm },
  menuItemsRow: { justifyContent: 'space-between', marginBottom: spacing.md },

  menuItemCard: { width: '48%', marginBottom: spacing.sm },

  imageWrap: {
    height: 130,
    backgroundColor: colors.warmGray,
    overflow: 'hidden',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageFallbackText: { marginTop: 6, ...typography.labelSmall, color: colors.text.tertiary },

  badge: {
    position: 'absolute',
    top: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgePopular: { left: spacing.sm, backgroundColor: colors.primary.main },
  badgeNew: { right: spacing.sm, backgroundColor: colors.success },
  badgeText: { ...typography.labelSmall, color: colors.white, fontWeight: '700' },

  menuItemContent: { padding: spacing.md },

  menuItemName: { ...typography.titleSmall, color: colors.text.primary, marginBottom: spacing.xs },
  menuItemDescription: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.sm },

  menuItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuItemPrice: { ...typography.titleMedium, color: colors.primary.main, fontWeight: '800' },
  menuItemCalories: { ...typography.labelSmall, color: colors.text.tertiary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing['4xl'] },
  emptyText: { ...typography.bodyMedium, color: colors.text.secondary, marginTop: spacing.md, textAlign: 'center' },
  placeholderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  placeholderCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  placeholderImage: { width: '100%', height: 90 },
  placeholderInfo: { padding: spacing.sm },
  placeholderName: { ...typography.labelMedium, color: colors.text.primary },
  placeholderPrice: {
    ...typography.labelSmall,
    color: colors.primary.main,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});

export default MenuScreen;
