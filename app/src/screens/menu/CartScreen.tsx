import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useCart, useLocation, useToast } from '../../store';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

type MenuStackParamList = {
  Menu: { categoryId?: string };
  MenuItemDetail: { itemId: string };
  Cart: undefined;
  Checkout: undefined;
};

type Props = NativeStackScreenProps<MenuStackParamList, 'Cart'>;

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const { cart, itemCount, removeItem, updateQuantity, getItemTotal, clearCart } = useCart();
  const { selectedLocation } = useLocation();
  const { showToast } = useToast();

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      removeItem(itemId);
      showToast('Item removed from cart', 'info');
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!selectedLocation) {
      showToast('Please select a pickup location first', 'warning');
      return;
    }
    navigation.navigate('Checkout');
  };

  if (itemCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some delicious items from our menu!
          </Text>
          <Button
            title="Browse Menu"
            onPress={() => navigation.navigate('Menu', {})}
            style={styles.browseButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => navigation.getParent()?.navigate('LocationsTab')}
        >
          <View style={styles.locationLeft}>
            <Ionicons name="location" size={20} color={colors.primary.main} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup from</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {selectedLocation?.name || 'Select a location'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Cart Items */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Order ({itemCount} items)</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {cart.items.map((item) => (
            <Card key={item.id} style={styles.cartItem} variant="outlined" padding="none">
              <View style={styles.cartItemContent}>
                {/* Image placeholder */}
                <View style={styles.itemImagePlaceholder}>
                  <Ionicons name="fast-food" size={28} color={colors.text.tertiary} />
                </View>

                {/* Item Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  
                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <Text style={styles.itemModifiers} numberOfLines={2}>
                      {item.modifiers.map((m) => m.name).join(', ')}
                    </Text>
                  )}

                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <Text style={styles.itemInstructions} numberOfLines={1}>
                      Note: {item.specialInstructions}
                    </Text>
                  )}

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>
                      {formatPrice(getItemTotal(item))}
                    </Text>

                    {/* Quantity Controls */}
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(item.id, -1)}
                        accessibilityLabel="Decrease quantity"
                      >
                        <Ionicons
                          name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                          size={18}
                          color={item.quantity === 1 ? colors.error : colors.text.primary}
                        />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(item.id, 1)}
                        accessibilityLabel="Increase quantity"
                      >
                        <Ionicons name="add" size={18} color={colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Order Summary */}
        <Card style={styles.summaryCard} variant="filled">
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(cart.subtotal)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatPrice(cart.tax)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
          </View>
        </Card>

        {/* Rewards Hint */}
        <View style={styles.rewardsHint}>
          <Ionicons name="star" size={20} color={colors.gold} />
          <Text style={styles.rewardsHintText}>
            You'll earn {Math.floor(cart.total * 10)} points on this order!
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <Button
          title={`Checkout • ${formatPrice(cart.total)}`}
          onPress={handleCheckout}
          disabled={!selectedLocation}
          style={styles.checkoutButton}
        />
        {!selectedLocation && (
          <Text style={styles.locationWarning}>
            Please select a pickup location
          </Text>
        )}
      </View>
    </SafeAreaView>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.warmGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  browseButton: {
    minWidth: 200,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
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
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  itemsSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  clearText: {
    ...typography.labelMedium,
    color: colors.error,
  },
  cartItem: {
    marginBottom: spacing.md,
  },
  cartItemContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  itemImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warmGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemModifiers: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemInstructions: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  itemPrice: {
    ...typography.titleSmall,
    color: colors.primary.main,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmGray,
    borderRadius: borderRadius.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...typography.titleSmall,
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  summaryCard: {
    margin: spacing.lg,
  },
  summaryTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.main,
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.headlineSmall,
    color: colors.primary.main,
    fontWeight: '700',
  },
  rewardsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.gold + '15',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  rewardsHintText: {
    ...typography.labelMedium,
    color: colors.gold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  checkoutButton: {},
  locationWarning: {
    ...typography.labelSmall,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default CartScreen;
