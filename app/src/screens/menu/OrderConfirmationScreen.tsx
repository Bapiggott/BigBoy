import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button, Card } from '../../components';
import { MenuStackParamList } from '../../navigation/types';
import * as ordersApi from '../../api/endpoints/orders';

type Props = NativeStackScreenProps<MenuStackParamList, 'OrderConfirmation'>;
type ConfirmationNavigation = NativeStackNavigationProp<MenuStackParamList, 'OrderConfirmation'>;

const OrderConfirmationScreen = ({ route }: Props) => {
  const { orderId } = route.params;
  const navigation = useNavigation<ConfirmationNavigation>();
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  const checkAnimation = new Animated.Value(0);

  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      const order = await ordersApi.getOrder(orderId);
      if (order) {
        setOrderNumber(order.orderNumber);
        // Use estimatedReady or estimatedTime
        const estTime = order.estimatedReady || order.estimatedTime;
        if (estTime) {
          const time = new Date(estTime);
          setEstimatedTime(
            time.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
          );
        }
      }
    };
    fetchOrder();

    // Animate checkmark
    Animated.spring(checkAnimation, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [orderId]);

  const handleViewOrder = () => {
    // Navigate to order details in the home tab
    navigation.getParent()?.navigate('HomeTab', {
      screen: 'OrderDetail',
      params: { orderId },
    });
  };

  const handleBackToMenu = () => {
    navigation.navigate('Menu', {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.checkCircle,
            {
              transform: [{ scale: checkAnimation }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={64} color={colors.white} />
        </Animated.View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Thank you for your order</Text>

        {/* Order Info Card */}
        <Card style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Number</Text>
            <Text style={styles.orderValue}>{orderNumber || '...'}</Text>
          </View>
          {estimatedTime && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Estimated Ready</Text>
              <Text style={styles.orderValue}>{estimatedTime}</Text>
            </View>
          )}
        </Card>

        {/* Next Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>What's Next?</Text>
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.stepText}>
              We'll notify you when your order is ready
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="location-outline" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.stepText}>
              Head to the counter to pick up your order
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.stepText}>
              Show your order number to the staff
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="View Order"
          onPress={handleViewOrder}
          variant="primary"
        />
        <Button
          title="Back to Menu"
          onPress={handleBackToMenu}
          variant="outline"
          style={styles.secondaryButton}
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['4xl'],
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },
  orderCard: {
    width: '100%',
    marginBottom: spacing['2xl'],
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  orderLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  orderValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  stepsTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  actions: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});

export default OrderConfirmationScreen;
