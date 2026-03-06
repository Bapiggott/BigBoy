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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, Button } from '../../components';
import { useToast } from '../../store/ToastContext';
import { AccountStackParamList } from '../../navigation/types';
import {
  DiscountData,
  CreateDiscountRequest,
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
  getAdminCategories,
  AdminCategory,
  getAdminMenuItems,
  AdminMenuItem,
} from '../../api/endpoints/admin';
import { getLocations } from '../../api/endpoints/locations';
import { Location } from '../../types';

type Props = NativeStackScreenProps<AccountStackParamList, 'AdminDiscounts'>;

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: '% Off' },
  { value: 'FIXED_AMOUNT', label: '$ Off' },
  { value: 'BOGO', label: 'BOGO' },
  { value: 'FREE_ITEM', label: 'Free Item' },
  { value: 'BOGO_CATEGORY', label: 'BOGO Cat.' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AdminDiscountScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DiscountData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [applicableItemId, setApplicableItemId] = useState<string | null>(null);
  const [applicableCategoryId, setApplicableCategoryId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [activeTimeStart, setActiveTimeStart] = useState('');
  const [activeTimeEnd, setActiveTimeEnd] = useState('');
  const [stackable, setStackable] = useState(false);
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [discResult, catsData, itemsData, locsData] = await Promise.all([
        getDiscounts(),
        getAdminCategories(),
        getAdminMenuItems({ limit: 200 }),
        getLocations(),
      ]);
      setDiscounts(discResult.discounts);
      setCategories(catsData);
      setMenuItems(itemsData.items);
      setLocations(locsData);
    } catch (error) {
      showToast('Failed to load discounts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setName(''); setDescription(''); setDiscountType('PERCENTAGE'); setDiscountValue('');
    setMinOrderAmount(''); setMaxDiscount(''); setApplicableItemId(null); setApplicableCategoryId(null);
    setExpiresAt(''); setActiveDays([]); setActiveTimeStart(''); setActiveTimeEnd('');
    setStackable(false); setPriority('0'); setIsActive(true); setSelectedLocationIds([]);
  };

  const openCreate = () => { setEditingItem(null); resetForm(); setModalVisible(true); };

  const openEdit = (item: DiscountData) => {
    setEditingItem(item);
    setName(item.name); setDescription(item.description || '');
    setDiscountType(item.discountType); setDiscountValue(String(item.discountValue));
    setMinOrderAmount(item.minOrderAmount ? String(item.minOrderAmount) : '');
    setMaxDiscount(item.maxDiscount ? String(item.maxDiscount) : '');
    setApplicableItemId(item.applicableItemId); setApplicableCategoryId(item.applicableCategoryId);
    setExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 10) : '');
    setActiveDays(item.activeDays ? JSON.parse(item.activeDays) : []);
    setActiveTimeStart(item.activeTimeStart || ''); setActiveTimeEnd(item.activeTimeEnd || '');
    setStackable(item.stackable); setPriority(String(item.priority)); setIsActive(item.isActive);
    setSelectedLocationIds(item.locations.map(l => l.id));
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    if (!discountValue || isNaN(parseFloat(discountValue))) { showToast('Discount value is required', 'error'); return; }

    setSubmitting(true);
    try {
      const data: CreateDiscountRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        applicableItemId: applicableItemId || null,
        applicableCategoryId: applicableCategoryId || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        activeDays: activeDays.length > 0 ? JSON.stringify(activeDays) : null,
        activeTimeStart: activeTimeStart || null,
        activeTimeEnd: activeTimeEnd || null,
        stackable,
        priority: parseInt(priority) || 0,
        isActive,
        locationIds: selectedLocationIds.length > 0 ? selectedLocationIds : undefined,
      };

      if (editingItem) {
        await updateDiscount(editingItem.id, data);
        showToast('Discount updated', 'success');
      } else {
        await createDiscount(data);
        showToast('Discount created', 'success');
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: DiscountData) => {
    Alert.alert('Delete Discount', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteDiscount(item.id); showToast('Deleted', 'success'); loadData(); }
          catch { showToast('Failed to delete', 'error'); }
        },
      },
    ]);
  };

  const toggleDay = (day: number) => {
    setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const getDiscountLabel = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE': return `${value}% off`;
      case 'FIXED_AMOUNT': return `$${value.toFixed(2)} off`;
      case 'BOGO': return value === 100 ? 'BOGO Free' : `BOGO ${value}% off`;
      case 'FREE_ITEM': return 'Free Item';
      case 'BOGO_CATEGORY': return 'BOGO Category';
      default: return `${value}`;
    }
  };

  const renderItem = ({ item }: { item: DiscountData }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>Inactive</Text></View>
            )}
          </View>
          {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
        </View>
        <Text style={styles.discountLabel}>{getDiscountLabel(item.discountType, item.discountValue)}</Text>
      </View>

      <View style={styles.metaRow}>
        {item.activeDays && <Text style={styles.metaText}>{JSON.parse(item.activeDays).map((d: number) => DAYS[d]).join(', ')}</Text>}
        {item.activeTimeStart && <Text style={styles.metaText}>{item.activeTimeStart}–{item.activeTimeEnd}</Text>}
        {item.locations.length > 0 && <Text style={styles.metaText}>{item.locations.length} location(s)</Text>}
        <Text style={styles.metaText}>Used: {item.timesUsed}x</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={async () => { try { await toggleDiscount(item.id); loadData(); } catch {} }}>
          <Ionicons name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={20} color={colors.primary.main} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandedHeader title="Discounts & Deals" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandedHeader title="Discounts & Deals" onBackPress={() => navigation.goBack()} />

      <View style={styles.topBar}>
        <Text style={styles.countText}>{discounts.length} discount(s)</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>New Deal</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={discounts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadData(); }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No discounts yet</Text>
            <Button title="Create First Deal" onPress={openCreate} style={{ marginTop: spacing.md }} />
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Discount' : 'New Discount'}</Text>
            <View style={{ width: 28 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="e.g., Taco Tuesday" placeholderTextColor={colors.text.tertiary} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, styles.formTextArea]} value={description} onChangeText={setDescription} placeholder="Deal description" placeholderTextColor={colors.text.tertiary} multiline />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Discount Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {DISCOUNT_TYPES.map(dt => (
                    <TouchableOpacity key={dt.value} style={[styles.typeChip, discountType === dt.value && styles.typeChipActive]} onPress={() => setDiscountType(dt.value)}>
                      <Text style={[styles.typeChipText, discountType === dt.value && styles.typeChipTextActive]}>{dt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Value {discountType === 'PERCENTAGE' ? '(%)' : '($)'}</Text>
                <TextInput style={styles.formInput} value={discountValue} onChangeText={setDiscountValue} placeholder="0" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
              </View>

              {(discountType === 'BOGO' || discountType === 'FREE_ITEM') && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Applicable Item</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={[styles.typeChip, !applicableItemId && styles.typeChipActive]} onPress={() => setApplicableItemId(null)}>
                      <Text style={[styles.typeChipText, !applicableItemId && styles.typeChipTextActive]}>Any</Text>
                    </TouchableOpacity>
                    {menuItems.slice(0, 15).map(mi => (
                      <TouchableOpacity key={mi.id} style={[styles.typeChip, applicableItemId === mi.id && styles.typeChipActive]} onPress={() => setApplicableItemId(mi.id)}>
                        <Text style={[styles.typeChipText, applicableItemId === mi.id && styles.typeChipTextActive]} numberOfLines={1}>{mi.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {discountType === 'BOGO_CATEGORY' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.typeChip, applicableCategoryId === c.id && styles.typeChipActive]} onPress={() => setApplicableCategoryId(c.id)}>
                        <Text style={[styles.typeChipText, applicableCategoryId === c.id && styles.typeChipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Min Order ($)</Text>
                  <TextInput style={styles.formInput} value={minOrderAmount} onChangeText={setMinOrderAmount} placeholder="0" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.formLabel}>Max Discount ($)</Text>
                  <TextInput style={styles.formInput} value={maxDiscount} onChangeText={setMaxDiscount} placeholder="No cap" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
                </View>
              </View>

              {/* Day restrictions */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Active Days (leave empty for all)</Text>
                <View style={styles.daysRow}>
                  {DAYS.map((day, i) => (
                    <TouchableOpacity key={i} style={[styles.dayChip, activeDays.includes(i) && styles.dayChipActive]} onPress={() => toggleDay(i)}>
                      <Text style={[styles.dayChipText, activeDays.includes(i) && styles.dayChipTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time restrictions */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Start Time</Text>
                  <TextInput style={styles.formInput} value={activeTimeStart} onChangeText={setActiveTimeStart} placeholder="HH:MM" placeholderTextColor={colors.text.tertiary} />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.formLabel}>End Time</Text>
                  <TextInput style={styles.formInput} value={activeTimeEnd} onChangeText={setActiveTimeEnd} placeholder="HH:MM" placeholderTextColor={colors.text.tertiary} />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expiry (YYYY-MM-DD)</Text>
                <TextInput style={styles.formInput} value={expiresAt} onChangeText={setExpiresAt} placeholder="No expiry" placeholderTextColor={colors.text.tertiary} />
              </View>

              {/* Location restrictions */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Locations (leave empty for all)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {locations.map(loc => {
                    const selected = selectedLocationIds.includes(loc.id);
                    return (
                      <TouchableOpacity
                        key={loc.id}
                        style={[styles.typeChip, selected && styles.typeChipActive]}
                        onPress={() => setSelectedLocationIds(prev =>
                          selected ? prev.filter(id => id !== loc.id) : [...prev, loc.id]
                        )}
                      >
                        <Ionicons name={selected ? 'checkmark-circle' : 'location-outline'} size={14} color={selected ? colors.white : colors.text.secondary} />
                        <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]} numberOfLines={1}>{loc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedLocationIds.length === 0 && (
                  <Text style={{ ...typography.labelSmall, color: colors.text.tertiary, marginTop: 4 }}>Applies to all locations</Text>
                )}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Stackable</Text>
                <Switch value={stackable} onValueChange={setStackable} trackColor={{ true: colors.primary.main }} />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Priority</Text>
                  <TextInput style={styles.formInput} value={priority} onChangeText={setPriority} placeholder="0" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <View style={styles.switchRow}>
                    <Text style={styles.formLabel}>Active</Text>
                    <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary.main }} />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={editingItem ? 'Save Changes' : 'Create Discount'}
                onPress={handleSubmit}
                disabled={submitting}
                loading={submitting}
                style={styles.submitButton}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  countText: { ...typography.bodyMedium, color: colors.text.secondary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary.main, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { ...typography.labelMedium, color: colors.white },
  listContent: { padding: spacing.md, paddingTop: 0 },
  itemCard: { marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { ...typography.titleMedium, color: colors.text.primary },
  inactiveBadge: { backgroundColor: colors.error + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactiveBadgeText: { ...typography.labelSmall, color: colors.error },
  discountLabel: { ...typography.titleMedium, color: colors.success, fontWeight: '600' },
  itemDesc: { ...typography.bodySmall, color: colors.text.tertiary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  metaText: { ...typography.labelSmall, color: colors.text.tertiary },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: spacing.sm },
  actionBtn: { padding: spacing.xs },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.text.tertiary },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  modalTitle: { ...typography.titleLarge, color: colors.text.primary },
  modalFooter: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.lightGray },
  submitButton: { width: '100%' },
  formScroll: { flex: 1 },
  formContent: { padding: spacing.lg },
  formGroup: { marginBottom: spacing.md },
  formRow: { flexDirection: 'row' },
  formLabel: { ...typography.labelMedium, color: colors.text.secondary, marginBottom: spacing.xs },
  formInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium, color: colors.text.primary },
  formTextArea: { minHeight: 60, textAlignVertical: 'top' },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.lightGray, marginRight: spacing.sm },
  typeChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  typeChipText: { ...typography.labelMedium, color: colors.text.secondary },
  typeChipTextActive: { color: colors.white },
  daysRow: { flexDirection: 'row', gap: spacing.xs },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.lightGray },
  dayChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  dayChipText: { ...typography.labelSmall, color: colors.text.secondary },
  dayChipTextActive: { color: colors.white },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
});

export default AdminDiscountScreen;
