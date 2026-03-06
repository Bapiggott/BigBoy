import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, Button } from '../../components';
import { useToast } from '../../store/ToastContext';
import { AccountStackParamList } from '../../navigation/types';
import {
  AdminMenuItem,
  AdminCategory,
  getAdminMenuItems,
  getAdminCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  CreateMenuItemRequest,
  LocationAvailability,
  getItemLocationOverrides,
  setItemLocationOverrides,
} from '../../api/endpoints/admin';

type Props = NativeStackScreenProps<AccountStackParamList, 'AdminMenu'>;

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  calories: string;
  prepTime: string;
  isPopular: boolean;
  isNew: boolean;
  isAvailable: boolean;
}

const initialFormData: MenuItemFormData = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageUrl: '',
  calories: '',
  prepTime: '',
  isPopular: false,
  isNew: false,
  isAvailable: true,
};

const AdminMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  // Location override modal state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationItem, setLocationItem] = useState<AdminMenuItem | null>(null);
  const [locations, setLocations] = useState<LocationAvailability[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsSaving, setLocationsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [itemsResponse, categoriesData] = await Promise.all([
        getAdminMenuItems({
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          limit: 100,
        }),
        getAdminCategories(),
      ]);

      setItems(itemsResponse.items);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      showToast('Failed to load menu data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    setLoading(true);
    loadData();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setModalVisible(true);
  };

  const openEditModal = (item: AdminMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      calories: item.calories?.toString() || '',
      prepTime: item.prepTime?.toString() || '',
      isPopular: item.isPopular,
      isNew: item.isNew,
      isAvailable: item.isAvailable,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      showToast('Valid price is required', 'error');
      return;
    }
    if (!formData.categoryId) {
      showToast('Category is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data: CreateMenuItemRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        imageUrl: formData.imageUrl.trim() || null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        isPopular: formData.isPopular,
        isNew: formData.isNew,
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        showToast('Menu item updated', 'success');
      } else {
        await createMenuItem(data);
        showToast('Menu item created', 'success');
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to save menu item:', error);
      showToast('Failed to save menu item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: AdminMenuItem) => {
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
              showToast('Menu item deleted', 'success');
              loadData();
            } catch (error) {
              console.error('Failed to delete menu item:', error);
              showToast('Failed to delete menu item', 'error');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async (item: AdminMenuItem) => {
    try {
      await toggleMenuItemAvailability(item.id, !item.isAvailable);
      showToast(
        `${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`,
        'success'
      );
      loadData();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      showToast('Failed to update availability', 'error');
    }
  };

  const openLocationModal = async (item: AdminMenuItem) => {
    setLocationItem(item);
    setLocationModalVisible(true);
    setLocationsLoading(true);
    try {
      const locs = await getItemLocationOverrides(item.id);
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load location overrides:', error);
      showToast('Failed to load locations', 'error');
      setLocationModalVisible(false);
    } finally {
      setLocationsLoading(false);
    }
  };

  const toggleLocationAvailability = (locationId: string) => {
    setLocations(prev =>
      prev.map(loc =>
        loc.id === locationId ? { ...loc, isAvailable: !loc.isAvailable } : loc
      )
    );
  };

  const handleSaveLocationOverrides = async () => {
    if (!locationItem) return;
    setLocationsSaving(true);
    try {
      const overrides = locations.map(loc => ({
        locationId: loc.id,
        isAvailable: loc.isAvailable,
      }));
      await setItemLocationOverrides(locationItem.id, overrides);
      showToast('Location availability updated', 'success');
      setLocationModalVisible(false);
    } catch (error) {
      console.error('Failed to save location overrides:', error);
      showToast('Failed to save location availability', 'error');
    } finally {
      setLocationsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: AdminMenuItem }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category.name}</Text>
        </View>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>

      {item.description ? (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.itemBadges}>
        {item.isPopular && (
          <View style={[styles.badge, styles.popularBadge]}>
            <Text style={styles.badgeText}>Popular</Text>
          </View>
        )}
        {item.isNew && (
          <View style={[styles.badge, styles.newBadge]}>
            <Text style={styles.badgeText}>New</Text>
          </View>
        )}
        {!item.isAvailable && (
          <View style={[styles.badge, styles.unavailableBadge]}>
            <Text style={styles.badgeText}>Unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openLocationModal(item)}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleAvailability(item)}
        >
          <Ionicons
            name={item.isAvailable ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={colors.primary.main}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory('')}
      >
        <Text
          style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryChip,
            selectedCategory === cat.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(cat.id)}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive,
            ]}
          >
            {cat.name} ({cat.itemCount})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderLocationModal = () => (
    <Modal
      visible={locationModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Store Availability</Text>
          <View style={{ width: 28 }} />
        </View>

        {locationItem && (
          <View style={styles.locationItemBanner}>
            <Text style={styles.locationItemName}>{locationItem.name}</Text>
            <Text style={styles.locationItemHint}>
              Toggle locations where this item is available. All are enabled by default.
            </Text>
          </View>
        )}

        {locationsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>Loading locations...</Text>
          </View>
        ) : (
          <ScrollView style={styles.locationList} contentContainerStyle={styles.locationListContent}>
            {locations.map(loc => (
              <TouchableOpacity
                key={loc.id}
                style={[
                  styles.locationRow,
                  !loc.isAvailable && styles.locationRowDisabled,
                ]}
                onPress={() => toggleLocationAvailability(loc.id)}
              >
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  <Text style={styles.locationCity}>
                    {loc.city}, {loc.state}
                  </Text>
                </View>
                <Ionicons
                  name={loc.isAvailable ? 'checkmark-circle' : 'close-circle'}
                  size={28}
                  color={loc.isAvailable ? colors.success : colors.error}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.modalFooter}>
          <Button
            title="Save Location Settings"
            onPress={handleSaveLocationOverrides}
            disabled={locationsSaving || locationsLoading}
            loading={locationsSaving}
            style={styles.submitButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderFormModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBody}
        >
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="Item name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Item description"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Price */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Price *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelector}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      formData.categoryId === cat.id &&
                        styles.categoryOptionActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, categoryId: cat.id })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.categoryId === cat.id &&
                          styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Image URL */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Image URL</Text>
              <TextInput
                style={styles.formInput}
                value={formData.imageUrl}
                onChangeText={(text) =>
                  setFormData({ ...formData, imageUrl: text })
                }
                placeholder="https://..."
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Calories & Prep Time */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.formLabel}>Calories</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.calories}
                  onChangeText={(text) =>
                    setFormData({ ...formData, calories: text })
                  }
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.formLabel}>Prep Time (min)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.prepTime}
                  onChangeText={(text) =>
                    setFormData({ ...formData, prepTime: text })
                  }
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Toggles */}
            <View style={styles.formToggles}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.isPopular && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, isPopular: !formData.isPopular })
                }
              >
                <Ionicons
                  name={formData.isPopular ? 'star' : 'star-outline'}
                  size={18}
                  color={formData.isPopular ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    formData.isPopular && styles.toggleButtonTextActive,
                  ]}
                >
                  Popular
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.isNew && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, isNew: !formData.isNew })
                }
              >
                <Ionicons
                  name={formData.isNew ? 'sparkles' : 'sparkles-outline'}
                  size={18}
                  color={formData.isNew ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    formData.isNew && styles.toggleButtonTextActive,
                  ]}
                >
                  New
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.isAvailable && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, isAvailable: !formData.isAvailable })
                }
              >
                <Ionicons
                  name={formData.isAvailable ? 'eye' : 'eye-off-outline'}
                  size={18}
                  color={formData.isAvailable ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    formData.isAvailable && styles.toggleButtonTextActive,
                  ]}
                >
                  Available
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title={editingItem ? 'Save Changes' : 'Create Item'}
              onPress={handleSubmit}
              disabled={submitting}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandedHeader title="Menu Management" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandedHeader title="Menu Management" onBackPress={() => navigation.goBack()} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search menu items..."
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setLoading(true);
                loadData();
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={colors.text.tertiary}
            />
            <Text style={styles.emptyText}>No menu items found</Text>
            <Button
              title="Add First Item"
              onPress={openCreateModal}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {/* Form Modal */}
      {renderFormModal()}

      {/* Location Override Modal */}
      {renderLocationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilter: {
    maxHeight: 44,
  },
  categoryFilterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryChipText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  itemCategory: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  itemPrice: {
    ...typography.titleMedium,
    color: colors.primary.main,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  itemBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadge: {
    backgroundColor: colors.warning + '20',
  },
  newBadge: {
    backgroundColor: colors.success + '20',
  },
  unavailableBadge: {
    backgroundColor: colors.error + '20',
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    ...typography.bodyLarge,
    color: colors.text.tertiary,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  modalBody: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexGrow: 0,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginRight: spacing.sm,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryOptionText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  categoryOptionTextActive: {
    color: colors.white,
  },
  formToggles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  toggleButtonText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  toggleButtonTextActive: {
    color: colors.white,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  submitButton: {
    width: '100%',
  },
  // Location modal styles
  locationItemBanner: {
    padding: spacing.md,
    backgroundColor: colors.primary.main + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  locationItemName: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: 4,
  },
  locationItemHint: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  locationList: {
    flex: 1,
  },
  locationListContent: {
    padding: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  locationRowDisabled: {
    opacity: 0.6,
    backgroundColor: colors.lightGray + '40',
  },
  locationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  locationName: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '600',
  },
  locationCity: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

export default AdminMenuScreen;
