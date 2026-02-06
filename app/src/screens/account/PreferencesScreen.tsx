import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, OfflineBanner } from '../../components';
import { useNetwork } from '../../store/NetworkContext';
import { useLocation } from '../../store/LocationContext';
import { useToast } from '../../store/ToastContext';

type OrderType = 'pickup' | 'dine-in' | 'delivery';

const PreferencesScreen: React.FC = () => {
  const { isOffline } = useNetwork();
  const { selectedLocation } = useLocation();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Order Preferences
  const [defaultOrderType, setDefaultOrderType] = useState<OrderType>('pickup');
  const [saveOrderHistory, setSaveOrderHistory] = useState(true);
  const [quickReorder, setQuickReorder] = useState(true);

  // Dietary Preferences
  const [dietaryPrefs, setDietaryPrefs] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  });

  // Display Preferences
  const [showCalories, setShowCalories] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [largeText, setLargeText] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const toggleDietaryPref = (key: keyof typeof dietaryPrefs) => {
    setDietaryPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    showToast('Preference updated', 'success');
  };

  const orderTypes: { type: OrderType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'pickup', label: 'Pickup', icon: 'bag-handle-outline' },
    { type: 'dine-in', label: 'Dine-in', icon: 'restaurant-outline' },
    { type: 'delivery', label: 'Delivery', icon: 'car-outline' },
  ];

  const dietaryOptions: { key: keyof typeof dietaryPrefs; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline' },
    { key: 'vegan', label: 'Vegan', icon: 'nutrition-outline' },
    { key: 'glutenFree', label: 'Gluten-Free', icon: 'warning-outline' },
    { key: 'dairyFree', label: 'Dairy-Free', icon: 'water-outline' },
    { key: 'nutFree', label: 'Nut-Free', icon: 'shield-checkmark-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BrandedHeader title="Preferences" showBack />
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Default Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Location</Text>
          <Card style={styles.locationCard}>
            <View style={styles.locationContent}>
              <Ionicons name="location" size={24} color={colors.primary.main} />
              <View style={styles.locationInfo}>
                {selectedLocation ? (
                  <>
                    <Text style={styles.locationName}>{selectedLocation.name}</Text>
                    <Text style={styles.locationAddress}>
                      {selectedLocation.address}, {selectedLocation.city}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.locationName}>No location selected</Text>
                    <Text style={styles.locationAddress}>
                      Select a location from the Locations tab
                    </Text>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </View>
          </Card>
        </View>

        {/* Default Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Order Type</Text>
          <Card style={styles.orderTypeCard}>
            {orderTypes.map((option, index) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.orderTypeOption,
                  defaultOrderType === option.type && styles.orderTypeOptionSelected,
                  index < orderTypes.length - 1 && styles.orderTypeOptionBorder,
                ]}
                onPress={() => {
                  setDefaultOrderType(option.type);
                  showToast(`Default set to ${option.label}`, 'success');
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={defaultOrderType === option.type ? colors.primary.main : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.orderTypeLabel,
                    defaultOrderType === option.type && styles.orderTypeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {defaultOrderType === option.type && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Order Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Settings</Text>
          <Card style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Save Order History</Text>
                <Text style={styles.settingDescription}>
                  Keep track of your past orders
                </Text>
              </View>
              <Switch
                value={saveOrderHistory}
                onValueChange={setSaveOrderHistory}
                trackColor={{ false: colors.lightGray, true: colors.primary.light }}
                thumbColor={saveOrderHistory ? colors.primary.main : colors.mediumGray}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Quick Reorder</Text>
                <Text style={styles.settingDescription}>
                  Show recent orders on home screen
                </Text>
              </View>
              <Switch
                value={quickReorder}
                onValueChange={setQuickReorder}
                trackColor={{ false: colors.lightGray, true: colors.primary.light }}
                thumbColor={quickReorder ? colors.primary.main : colors.mediumGray}
              />
            </View>
          </Card>
        </View>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <Text style={styles.sectionSubtitle}>
            We'll highlight menu items that match your preferences
          </Text>
          <Card style={styles.dietaryCard}>
            {dietaryOptions.map((option, index) => (
              <View key={option.key}>
                <TouchableOpacity
                  style={styles.dietaryRow}
                  onPress={() => toggleDietaryPref(option.key)}
                >
                  <View style={styles.dietaryIconContainer}>
                    <Ionicons name={option.icon} size={20} color={colors.primary.main} />
                  </View>
                  <Text style={styles.dietaryLabel}>{option.label}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      dietaryPrefs[option.key] && styles.checkboxChecked,
                    ]}
                  >
                    {dietaryPrefs[option.key] && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
                {index < dietaryOptions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Settings</Text>
          <Card style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Show Calories</Text>
                <Text style={styles.settingDescription}>
                  Display calorie info on menu items
                </Text>
              </View>
              <Switch
                value={showCalories}
                onValueChange={setShowCalories}
                trackColor={{ false: colors.lightGray, true: colors.primary.light }}
                thumbColor={showCalories ? colors.primary.main : colors.mediumGray}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Show Prices</Text>
                <Text style={styles.settingDescription}>
                  Display prices on menu items
                </Text>
              </View>
              <Switch
                value={showPrices}
                onValueChange={setShowPrices}
                trackColor={{ false: colors.lightGray, true: colors.primary.light }}
                thumbColor={showPrices ? colors.primary.main : colors.mediumGray}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Large Text</Text>
                <Text style={styles.settingDescription}>
                  Increase text size throughout the app
                </Text>
              </View>
              <Switch
                value={largeText}
                onValueChange={setLargeText}
                trackColor={{ false: colors.lightGray, true: colors.primary.light }}
                thumbColor={largeText ? colors.primary.main : colors.mediumGray}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  locationCard: {
    marginTop: spacing.sm,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  locationAddress: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  orderTypeCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  orderTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  orderTypeOptionSelected: {
    backgroundColor: colors.primary.light,
  },
  orderTypeOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  orderTypeLabel: {
    ...typography.titleSmall,
    color: colors.text.secondary,
    flex: 1,
  },
  orderTypeLabelSelected: {
    color: colors.primary.main,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg,
  },
  dietaryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  dietaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dietaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dietaryLabel: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
});

export default PreferencesScreen;
