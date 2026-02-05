import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useUser, useLocation, useNetwork, useCart } from '../../store';
import { Card } from '../../components/Card';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getPopularItems, getRecentOrders } from '../../api';
import { MenuItem, Order } from '../../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { selectedLocation } = useLocation();
  const { isOffline } = useNetwork();
  const { itemCount } = useCart();

  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [items, orders] = await Promise.all([
        getPopularItems(),
        getRecentOrders(),
      ]);
      setPopularItems(items.slice(0, 6));
      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.firstName || 'Guest'}!</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('MenuTab', { screen: 'Cart' })}
            accessibilityLabel={`Cart with ${itemCount} items`}
          >
            <Ionicons name="cart-outline" size={24} color={colors.text.primary} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Selector */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => navigation.navigate('MoreTab', { screen: 'Locations' })}
          accessibilityRole="button"
          accessibilityLabel="Select pickup location"
        >
          <View style={styles.locationLeft}>
            <Ionicons name="location" size={24} color={colors.primary.main} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>
                {selectedLocation ? 'Pickup from' : 'Select a location'}
              </Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {selectedLocation?.name || 'Find a Big Boy near you'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Loyalty Points */}
        {user && (
          <Card style={styles.loyaltyCard} onPress={() => navigation.navigate('RewardsTab')}>
            <View style={styles.loyaltyContent}>
              <View style={styles.loyaltyLeft}>
                <Text style={styles.loyaltyTitle}>Big Boy Rewards</Text>
                <Text style={styles.loyaltyPoints}>
                  {user.loyaltyStatus?.currentPoints || 0} points
                </Text>
                <Text style={styles.loyaltyTier}>
                  {user.loyaltyStatus?.tier?.toUpperCase() || 'BRONZE'} Member
                </Text>
              </View>
              <View style={styles.loyaltyRight}>
                <Ionicons name="star" size={48} color={colors.gold} />
              </View>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MenuTab')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary.light }]}>
              <Ionicons name="restaurant" size={24} color={colors.primary.main} />
            </View>
            <Text style={styles.quickActionText}>Order Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('RewardsTab')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF5E6' }]}>
              <Ionicons name="gift" size={24} color={colors.gold} />
            </View>
            <Text style={styles.quickActionText}>Rewards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AccountTab', { screen: 'OrderHistory' })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="receipt" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MoreTab', { screen: 'Locations' })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="location" size={24} color={colors.info} />
            </View>
            <Text style={styles.quickActionText}>Locations</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MenuTab')}>
              <Text style={styles.seeAllText}>See Menu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScroll}
          >
            {popularItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.popularCard}
                onPress={() => 
                  navigation.navigate('MenuTab', {
                    screen: 'MenuItemDetail',
                    params: { itemId: item.id },
                  })
                }
              >
                <View style={styles.popularImagePlaceholder}>
                  <Ionicons name="fast-food" size={32} color={colors.text.tertiary} />
                </View>
                <View style={styles.popularInfo}>
                  <Text style={styles.popularName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.popularPrice}>{formatPrice(item.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AccountTab', { screen: 'OrderHistory' })}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentOrders.map((order) => (
              <Card
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate('HomeTab', {
                    screen: 'OrderDetail',
                    params: { orderId: order.id },
                  })
                }
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.orderStatus, styles[`status_${order.status}`]]}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>
                <View style={styles.orderItems}>
                  <Text style={styles.orderItemsText} numberOfLines={1}>
                    {order.items.map((i) => i.name).join(', ')}
                  </Text>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  <TouchableOpacity style={styles.reorderButton}>
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {},
  headerRight: {},
  greeting: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  userName: {
    ...typography.headlineSmall,
    color: colors.text.primary,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  locationLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  locationName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  loyaltyCard: {
    backgroundColor: colors.secondary.main,
    marginBottom: spacing.lg,
  },
  loyaltyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyLeft: {},
  loyaltyRight: {},
  loyaltyTitle: {
    ...typography.labelMedium,
    color: colors.white,
    opacity: 0.8,
  },
  loyaltyPoints: {
    ...typography.headlineMedium,
    color: colors.white,
  },
  loyaltyTier: {
    ...typography.labelMedium,
    color: colors.gold,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  seeAllText: {
    ...typography.labelMedium,
    color: colors.primary.main,
  },
  popularScroll: {
    paddingRight: spacing.lg,
  },
  popularCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  popularImagePlaceholder: {
    height: 100,
    backgroundColor: colors.warmGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularInfo: {
    padding: spacing.md,
  },
  popularName: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  popularPrice: {
    ...typography.labelLarge,
    color: colors.primary.main,
    fontWeight: '700',
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  orderDate: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  orderStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  status_pending: {
    backgroundColor: colors.warning + '20',
  },
  status_confirmed: {
    backgroundColor: colors.info + '20',
  },
  status_preparing: {
    backgroundColor: colors.info + '20',
  },
  status_ready: {
    backgroundColor: colors.success + '20',
  },
  status_completed: {
    backgroundColor: colors.success + '20',
  },
  status_cancelled: {
    backgroundColor: colors.error + '20',
  },
  orderStatusText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  orderItems: {
    marginBottom: spacing.md,
  },
  orderItemsText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  reorderButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
  },
  reorderText: {
    ...typography.labelMedium,
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default HomeScreen;
