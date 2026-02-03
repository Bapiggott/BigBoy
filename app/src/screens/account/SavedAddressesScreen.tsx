import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button } from '../../components';

interface Address {
  id: string;
  label: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  { id: '1', label: 'Home', street: '123 Main St', city: 'Warren', state: 'MI', zipCode: '48093', isDefault: true },
  { id: '2', label: 'Work', street: '456 Office Blvd', unit: 'Suite 200', city: 'Troy', state: 'MI', zipCode: '48084', isDefault: false },
];

const SavedAddressesScreen: React.FC = () => {
  const [addresses] = useState<Address[]>(mockAddresses);

  const renderAddress = ({ item }: { item: Address }) => (
    <Card style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressInfo}>
          <View style={styles.addressIcon}>
            <Ionicons
              name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'briefcase' : 'location'}
              size={20}
              color={colors.primary.main}
            />
          </View>
          <View style={styles.addressDetails}>
            <Text style={styles.addressLabel}>{item.label}</Text>
            <Text style={styles.addressText}>{item.street}</Text>
            {item.unit && <Text style={styles.addressText}>{item.unit}</Text>}
            <Text style={styles.addressText}>{item.city}, {item.state} {item.zipCode}</Text>
          </View>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <View style={styles.addressActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyText}>Add an address for faster delivery</Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Add New Address"
            onPress={() => {/* TODO: Navigate to add address */}}
            variant="outline"
            style={styles.addButton}
          />
        }
      />
    </View>
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
  addressCard: {
    marginBottom: spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  addressText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  defaultBadge: {
    backgroundColor: colors.success + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  defaultText: {
    ...typography.labelSmall,
    color: colors.success,
    fontWeight: '600',
  },
  addressActions: {
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

export default SavedAddressesScreen;
