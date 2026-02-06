import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BrandedHeader, Card, Button, LoadingScreen } from '../../components';
import { Order } from '../../types';
import * as ordersApi from '../../api/endpoints/orders';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<{ OrderDetail: { orderId: string } }, 'OrderDetail'>;

const OrderDetailScreen = ({ route }: Props) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await ordersApi.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchOrder();
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'confirmed':
        return colors.info;
      case 'preparing':
        return colors.primary.main;
      case 'ready':
        return colors.success;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'preparing':
        return 'restaurant-outline';
      case 'ready':
        return 'checkbox-outline';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading order..." />;
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Order Details" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
      {/* Order Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={getStatusIcon(order.status)}
            size={32}
            color={getStatusColor(order.status)}
          />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {formatStatus(order.status)}
            </Text>
            <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          </View>
        </View>
        {order.estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && (
          <View style={styles.estimatedTime}>
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.estimatedTimeText}>
              Estimated ready: {formatDate(order.estimatedTime)}
            </Text>
          </View>
        )}
      </Card>

      {/* Order Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>
            {order.orderType === 'pickup' ? 'Pickup' : order.orderType === 'dine-in' ? 'Dine-In' : 'Delivery'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{order.locationName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Placed</Text>
          <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
        </View>
      </Card>

      {/* Order Items */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <View style={styles.itemMain}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.modifiers.length > 0 && (
                  <Text style={styles.itemModifiers}>
                    {item.modifiers.map(m => m.name).join(', ')}
                  </Text>
                )}
                {item.specialInstructions && (
                  <Text style={styles.itemInstructions}>
                    Note: {item.specialInstructions}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.itemPrice}>${(item.price ?? 0).toFixed(2)}</Text>
          </View>
        ))}
      </Card>

      {/* Order Summary */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
        </View>
        {order.tip && order.tip > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>${order.tip.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
        {order.pointsEarned > 0 && (
          <View style={styles.pointsEarned}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={styles.pointsText}>
              Earned {order.pointsEarned} points
            </Text>
          </View>
        )}
      </Card>

      {/* Actions */}
      {order.status === 'completed' && (
        <View style={styles.actions}>
          <Button
            title="Reorder"
            onPress={() => {/* TODO: Implement reorder */}}
            variant="primary"
          />
        </View>
      )}
      </ScrollView>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    ...typography.headlineSmall,
  },
  orderNumber: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  estimatedTimeText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemMain: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  itemQuantity: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
    minWidth: 28,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  itemModifiers: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  itemInstructions: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing.xxs,
  },
  itemPrice: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.titleMedium,
    color: colors.primary.main,
    fontWeight: '700',
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  pointsText: {
    ...typography.bodyMedium,
    color: colors.gold,
    fontWeight: '500',
  },
  actions: {
    marginTop: spacing.lg,
  },
});

export default OrderDetailScreen;
