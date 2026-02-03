import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button } from '../../components';
import { useCart, useLocation, useUser, useToast } from '../../store';
import { MenuStackParamList } from '../../navigation/types';
import * as ordersApi from '../../api/endpoints/orders';

type CheckoutNavigation = NativeStackNavigationProp<MenuStackParamList, 'Checkout'>;

type OrderType = 'pickup' | 'dine-in';
type PaymentMethod = 'card' | 'cash' | 'apple-pay';

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<CheckoutNavigation>();
  const { cart, clearCart } = useCart();
  const { selectedLocation } = useLocation();
  const { user } = useUser();
  const { showToast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tip, setTip] = useState<number>(0);

  const tipOptions = [
    { label: 'No tip', value: 0 },
    { label: '15%', value: Math.round(cart.subtotal * 0.15 * 100) / 100 },
    { label: '18%', value: Math.round(cart.subtotal * 0.18 * 100) / 100 },
    { label: '20%', value: Math.round(cart.subtotal * 0.20 * 100) / 100 },
  ];

  const orderTotal = cart.total + tip;

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      Alert.alert('Select Location', 'Please select a pickup location first.');
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        locationId: selectedLocation.id,
        items: cart.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          modifiers: item.modifiers?.map(m => ({
            groupId: m.groupId,
            modifierId: m.modifierId,
          })) || [],
          specialInstructions: item.specialInstructions,
        })),
        orderType,
        tip,
      };

      const result = await ordersApi.createOrder(orderData);

      if (result) {
        clearCart();
        navigation.replace('OrderConfirmation', { orderId: result.orderId });
      } else {
        showToast('Failed to place order. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Order failed:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Location */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          {selectedLocation ? (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={24} color={colors.primary.main} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{selectedLocation.name}</Text>
                <Text style={styles.locationAddress}>
                  {selectedLocation.address}, {selectedLocation.city}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectLocation}
              onPress={() => {/* TODO: Navigate to locations */}}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
              <Text style={styles.selectLocationText}>Select a location</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Order Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                orderType === 'pickup' && styles.optionButtonActive,
              ]}
              onPress={() => setOrderType('pickup')}
            >
              <Ionicons
                name="bag-handle-outline"
                size={24}
                color={orderType === 'pickup' ? colors.primary.main : colors.text.secondary}
              />
              <Text
                style={[
                  styles.optionText,
                  orderType === 'pickup' && styles.optionTextActive,
                ]}
              >
                Pickup
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                orderType === 'dine-in' && styles.optionButtonActive,
              ]}
              onPress={() => setOrderType('dine-in')}
            >
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={orderType === 'dine-in' ? colors.primary.main : colors.text.secondary}
              />
              <Text
                style={[
                  styles.optionText,
                  orderType === 'dine-in' && styles.optionTextActive,
                ]}
              >
                Dine-In
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Tip */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Tip</Text>
          <View style={styles.tipRow}>
            {tipOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.tipButton,
                  tip === option.value && styles.tipButtonActive,
                ]}
                onPress={() => setTip(option.value)}
              >
                <Text
                  style={[
                    styles.tipText,
                    tip === option.value && styles.tipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value > 0 && (
                  <Text
                    style={[
                      styles.tipAmount,
                      tip === option.value && styles.tipAmountActive,
                    ]}
                  >
                    ${option.value.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Payment Method */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons
              name="card-outline"
              size={24}
              color={paymentMethod === 'card' ? colors.primary.main : colors.text.secondary}
            />
            <Text
              style={[
                styles.paymentText,
                paymentMethod === 'card' && styles.paymentTextActive,
              ]}
            >
              Credit/Debit Card
            </Text>
            {paymentMethod === 'card' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Ionicons
              name="cash-outline"
              size={24}
              color={paymentMethod === 'cash' ? colors.primary.main : colors.text.secondary}
            />
            <Text
              style={[
                styles.paymentText,
                paymentMethod === 'cash' && styles.paymentTextActive,
              ]}
            >
              Pay at Counter
            </Text>
            {paymentMethod === 'cash' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </TouchableOpacity>
        </Card>

        {/* Order Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${cart.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${cart.tax.toFixed(2)}</Text>
          </View>
          {tip > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>${tip.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderTotal.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Points Preview */}
        {user && (
          <Card style={styles.pointsCard}>
            <Ionicons name="star" size={20} color={colors.gold} />
            <Text style={styles.pointsText}>
              You'll earn {Math.floor(orderTotal * 10)} points with this order!
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <Button
          title={`Place Order • $${orderTotal.toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          disabled={!selectedLocation || cart.items.length === 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '600',
  },
  locationAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  selectLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectLocationText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.main,
    backgroundColor: colors.surface,
  },
  optionButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  optionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary.main,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.surface,
  },
  tipButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  tipText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  tipTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  tipAmount: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  tipAmountActive: {
    color: colors.primary.main,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    marginBottom: spacing.sm,
  },
  paymentOptionActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  paymentText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  paymentTextActive: {
    color: colors.primary.main,
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
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warmGray,
  },
  pointsText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default CheckoutScreen;
