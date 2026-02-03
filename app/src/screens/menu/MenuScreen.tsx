import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useCart, useLocation } from '../../store';
import { Card } from '../../components/Card';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getCategories, getMenuItems, searchMenuItems } from '../../api';
import { MenuCategory, MenuItem } from '../../types';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

type MenuStackParamList = {
  Menu: { categoryId?: string };
  MenuItemDetail: { itemId: string };
  Cart: undefined;
};

type Props = NativeStackScreenProps<MenuStackParamList, 'Menu'>;

const MenuItemImage: React.FC<{ item: MenuItem; style?: StyleProp<ImageStyle> }> = ({ item, style }) => {
  const resolved = resolveMenuImage(item);
  const [source, setSource] = useState(resolved.source);

  useEffect(() => {
    setSource(resolved.source);
  }, [item.id, item.imageUrl, item.image]);

  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      onError={() => setSource(MENU_IMAGE_PLACEHOLDER)}
    />
  );
};

const MenuScreen: React.FC<Props> = ({ navigation, route }) => {
  const { selectedLocation } = useLocation();
  const { itemCount } = useCart();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categoryTabs = useMemo(
    () => [{ id: 'all', name: 'All' } as const, ...categories],
    [categories]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, items] = await Promise.all([getCategories(), getMenuItems()]);
      setCategories(cats);
      setMenuItems(items);

      if (route.params?.categoryId) setSelectedCategory(route.params.categoryId);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setIsLoading(false);
    }
  }, [route.params?.categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      } catch (error) {
        console.error('Search failed:', error);
      }
      return;
    }

    if (trimmed.length === 0) {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
        setSelectedCategory('all');
      } catch (error) {
        console.error('Failed to reset menu:', error);
      }
    }
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === 'search') return menuItems;
    return menuItems.filter((item) => item.categoryId === selectedCategory);
  }, [menuItems, selectedCategory]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

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
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Menu</Text>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
            accessibilityLabel={`View cart with ${itemCount} items`}
          >
            <Ionicons name="cart" size={22} color={colors.text.primary} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {selectedLocation && (
          <Text style={styles.locationText}>Ordering from {selectedLocation.name}</Text>
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
              {isLoading ? 'Loading menu...' : 'No items found'}
            </Text>
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

  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: { ...typography.labelSmall, color: colors.white, fontWeight: '700' },

  locationText: { ...typography.labelMedium, color: colors.text.secondary, marginBottom: spacing.md },

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

  categoriesList: { maxHeight: 52, backgroundColor: colors.background },
  categoriesContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },

  categoryTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  categoryTabActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  categoryTabText: { ...typography.labelMedium, color: colors.text.secondary },
  categoryTabTextActive: { color: colors.white },

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
  emptyText: { ...typography.bodyMedium, color: colors.text.secondary, marginTop: spacing.md },
});

export default MenuScreen;
