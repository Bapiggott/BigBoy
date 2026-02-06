import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Location } from '../types';
import { colors, spacing, typography, borderRadius } from '../theme';

type Props = {
  visible: boolean;
  locations: Location[];
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (location: Location) => void;
};

const getStatusLabel = (status?: Location['status']) => {
  if (status === 'coming_soon') return 'Coming Soon';
  if (status === 'tbd') return 'TBD';
  return 'Open';
};

export const LocationPickerModal: React.FC<Props> = ({
  visible,
  locations,
  selectedId,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Select a location</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close location picker">
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {locations.map((location) => {
              const isSelected = selectedId === location.id;
              const statusLabel = getStatusLabel(location.status);
              const isDisabled = location.status && location.status !== 'open';
              return (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.row,
                    isSelected && styles.rowSelected,
                    isDisabled && styles.rowDisabled,
                  ]}
                  onPress={() => onSelect(location)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${location.name}`}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <Text style={styles.locationAddress}>
                      {location.address ? `${location.address}, ` : ''}
                      {location.city}, {location.state} {location.zipCode}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.statusPill, isDisabled && styles.statusPillDisabled]}>
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rowSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  rowLeft: {
    marginBottom: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationName: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  locationAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusPill: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  statusPillDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border.light,
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
});

export default LocationPickerModal;
