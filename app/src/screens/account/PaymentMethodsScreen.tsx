import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BrandedHeader, Card, Button } from '../../components';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

// Mock data
const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', type: 'visa', lastFour: '4242', expiryMonth: 12, expiryYear: 2025, isDefault: true },
  { id: '2', type: 'mastercard', lastFour: '8888', expiryMonth: 6, expiryYear: 2026, isDefault: false },
];

const getCardIcon = (type: string) => {
  switch (type) {
    case 'visa': return 'card';
    case 'mastercard': return 'card';
    case 'amex': return 'card';
    default: return 'card-outline';
  }
};

const PaymentMethodsScreen: React.FC = () => {
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <Card style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={styles.cardIcon}>
            <Ionicons name={getCardIcon(item.type)} size={24} color={colors.primary.main} />
          </View>
          <View>
            <Text style={styles.cardType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} •••• {item.lastFour}
            </Text>
            <Text style={styles.cardExpiry}>
              Expires {item.expiryMonth.toString().padStart(2, '0')}/{item.expiryYear}
            </Text>
          </View>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Payment Methods" showBack />
      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentMethod}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyText}>Add a card to make checkout faster</Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Add Payment Method"
            onPress={() => {/* TODO: Navigate to add payment */}}
            variant="outline"
            style={styles.addButton}
          />
        }
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
  },
  paymentCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardType: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  cardExpiry: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  defaultBadge: {
    backgroundColor: colors.success + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  defaultText: {
    ...typography.labelSmall,
    color: colors.success,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  addButton: {
    marginTop: spacing.lg,
  },
});

export default PaymentMethodsScreen;
