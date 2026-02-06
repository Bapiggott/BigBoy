import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, LoadingScreen, OfflineBanner } from '../../components';
import { useNetwork } from '../../store/NetworkContext';
import { Order } from '../../types';
import * as ordersApi from '../../api/endpoints/orders';
import { AccountStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AccountStackParamList>;

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isOffline } = useNetwork();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'completed'>('all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'preparing':
      case 'ready':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const getStatusIcon = (status: Order['status']): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'preparing':
        return 'flame';
      case 'ready':
        return 'bag-check';
      case 'confirmed':
        return 'receipt';
      default:
        return 'time';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(order.createdAt) >= thirtyDaysAgo;
    }
    if (filter === 'completed') {
      return order.status === 'completed';
    }
    return true;
  });

  const renderOrderItem = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      activeOpacity={0.7}
    >
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={12} color={colors.white} />
            <Text style={styles.statusText}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {order.locationName}
            </Text>
          </View>
          <View style={styles.itemsRow}>
            <Ionicons name="receipt-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.itemsText}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
          <View style={styles.orderActions}>
            {order.status === 'completed' && (
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Handle reorder
                }}
              >
                <Ionicons name="repeat-outline" size={16} color={colors.primary.main} />
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyText}>
        Your order history will appear here once you place your first order.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      {(['all', 'recent', 'completed'] as const).map((filterType) => (
        <TouchableOpacity
          key={filterType}
          style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
          onPress={() => setFilter(filterType)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === filterType && styles.filterButtonTextActive,
            ]}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Loading order history..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Order History" showBack />
      <OfflineBanner />
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterButtonText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  orderDate: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.white,
  },
  orderDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemsText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.primary.light,
  },
  reorderText: {
    ...typography.labelMedium,
    color: colors.primary.main,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },
});

export default OrderHistoryScreen;
