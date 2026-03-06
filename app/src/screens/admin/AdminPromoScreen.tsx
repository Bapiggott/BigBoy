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
  PromoCodeData,
  CreatePromoCodeRequest,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCode,
  getPromoTemplates,
  PromoTemplate,
  getAdminCategories,
  AdminCategory,
  getAdminMenuItems,
  AdminMenuItem,
} from '../../api/endpoints/admin';
import { getLocations } from '../../api/endpoints/locations';
import { Location } from '../../types';

type Props = NativeStackScreenProps<AccountStackParamList, 'AdminPromos'>;

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: '% Off', icon: 'pricetag' },
  { value: 'FIXED_AMOUNT', label: '$ Off', icon: 'cash' },
  { value: 'BOGO', label: 'BOGO', icon: 'duplicate' },
  { value: 'FREE_ITEM', label: 'Free Item', icon: 'gift' },
  { value: 'BOGO_CATEGORY', label: 'BOGO Cat.', icon: 'albums' },
];

const AdminPromoScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  const [codes, setCodes] = useState<PromoCodeData[]>([]);
  const [templates, setTemplates] = useState<PromoTemplate[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PromoCodeData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'template' | 'form'>('template');

  // Form data
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [template, setTemplate] = useState('CUSTOM');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [maxTotalUses, setMaxTotalUses] = useState('');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [applicableItemId, setApplicableItemId] = useState<string | null>(null);
  const [applicableCategoryId, setApplicableCategoryId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [promoResult, templatesData, catsData, itemsData, locsData] = await Promise.all([
        getPromoCodes({ search: searchQuery || undefined }),
        getPromoTemplates(),
        getAdminCategories(),
        getAdminMenuItems({ limit: 200 }),
        getLocations(),
      ]);
      setCodes(promoResult.promoCodes);
      setTemplates(templatesData);
      setCategories(catsData);
      setMenuItems(itemsData.items);
      setLocations(locsData);
    } catch (error) {
      console.error('Failed to load promo data:', error);
      showToast('Failed to load promo codes', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setTemplate('CUSTOM');
    setMinOrderAmount('');
    setMaxDiscount('');
    setMaxTotalUses('');
    setMaxUsesPerUser('1');
    setApplicableItemId(null);
    setApplicableCategoryId(null);
    setExpiresAt('');
    setIsActive(true);
    setSelectedLocationIds([]);
    setStep('template');
  };

  const openCreate = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (item: PromoCodeData) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description || '');
    setDiscountType(item.discountType);
    setDiscountValue(String(item.discountValue));
    setTemplate(item.template);
    setMinOrderAmount(item.minOrderAmount ? String(item.minOrderAmount) : '');
    setMaxDiscount(item.maxDiscount ? String(item.maxDiscount) : '');
    setMaxTotalUses(item.maxTotalUses ? String(item.maxTotalUses) : '');
    setMaxUsesPerUser(String(item.maxUsesPerUser));
    setApplicableItemId(item.applicableItemId);
    setApplicableCategoryId(item.applicableCategoryId);
    setExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 10) : '');
    setIsActive(item.isActive);
    setSelectedLocationIds(item.locations.map(l => l.id));
    setStep('form');
    setModalVisible(true);
  };

  const selectTemplate = (t: PromoTemplate) => {
    setTemplate(t.id);
    setDiscountType(t.discountType);
    if (t.defaults.discountValue) setDiscountValue(String(t.defaults.discountValue));
    if (t.defaults.maxUsesPerUser) setMaxUsesPerUser(String(t.defaults.maxUsesPerUser));
    setName(t.name);
    setDescription(t.description);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!code.trim()) { showToast('Code is required', 'error'); return; }
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    if (!discountValue || isNaN(parseFloat(discountValue))) { showToast('Discount value is required', 'error'); return; }

    setSubmitting(true);
    try {
      const data: CreatePromoCodeRequest = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        template,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxTotalUses: maxTotalUses ? parseInt(maxTotalUses) : null,
        maxUsesPerUser: parseInt(maxUsesPerUser) || 1,
        applicableItemId: applicableItemId || null,
        applicableCategoryId: applicableCategoryId || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
        locationIds: selectedLocationIds.length > 0 ? selectedLocationIds : undefined,
      };

      if (editingItem) {
        await updatePromoCode(editingItem.id, data);
        showToast('Promo code updated', 'success');
      } else {
        await createPromoCode(data);
        showToast('Promo code created', 'success');
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: PromoCodeData) => {
    Alert.alert('Delete Promo Code', `Delete "${item.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deletePromoCode(item.id);
            showToast('Deleted', 'success');
            loadData();
          } catch { showToast('Failed to delete', 'error'); }
        },
      },
    ]);
  };

  const handleToggle = async (item: PromoCodeData) => {
    try {
      await togglePromoCode(item.id);
      showToast(`${item.code} ${item.isActive ? 'deactivated' : 'activated'}`, 'success');
      loadData();
    } catch { showToast('Failed to toggle', 'error'); }
  };

  const getDiscountLabel = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE': return `${value}% off`;
      case 'FIXED_AMOUNT': return `$${value.toFixed(2)} off`;
      case 'BOGO': return value === 100 ? 'Buy 1 Get 1 Free' : `Buy 1 Get 1 ${value}% off`;
      case 'FREE_ITEM': return 'Free Item';
      case 'BOGO_CATEGORY': return 'BOGO Category';
      default: return `${value}`;
    }
  };

  const renderItem = ({ item }: { item: PromoCodeData }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{item.code}</Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        <Text style={styles.discountLabel}>
          {getDiscountLabel(item.discountType, item.discountValue)}
        </Text>
      </View>

      {item.description ? (
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Used: {item.timesUsed}{item.maxTotalUses ? `/${item.maxTotalUses}` : ''}</Text>
        {item.expiresAt && (
          <Text style={styles.metaText}>Expires: {new Date(item.expiresAt).toLocaleDateString()}</Text>
        )}
        {item.locations.length > 0 && (
          <Text style={styles.metaText}>{item.locations.length} location(s)</Text>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggle(item)}>
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

  const renderTemplateStep = () => (
    <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
      <Text style={styles.sectionLabel}>Choose a Template</Text>
      <Text style={styles.sectionHint}>Select a preset or start from scratch</Text>

      <TouchableOpacity
        style={[styles.templateCard, styles.templateCardHighlight]}
        onPress={() => { setTemplate('CUSTOM'); setStep('form'); }}
      >
        <Ionicons name="construct" size={28} color={colors.primary.main} />
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>Custom</Text>
          <Text style={styles.templateDesc}>Build a fully custom promo code</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>

      {templates.map(t => (
        <TouchableOpacity
          key={t.id}
          style={styles.templateCard}
          onPress={() => selectTemplate(t)}
        >
          <Ionicons name={(t.icon || 'pricetag') as any} size={28} color={colors.primary.main} />
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{t.name}</Text>
            <Text style={styles.templateDesc}>{t.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFormStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        {/* Code */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Promo Code *</Text>
          <TextInput
            style={styles.formInput}
            value={code}
            onChangeText={t => setCode(t.toUpperCase().replace(/\s/g, ''))}
            placeholder="e.g., SUMMER20"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
          />
        </View>

        {/* Name */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Name *</Text>
          <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Promo name" placeholderTextColor={colors.text.tertiary} />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Description</Text>
          <TextInput style={[styles.formInput, styles.formTextArea]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor={colors.text.tertiary} multiline numberOfLines={2} />
        </View>

        {/* Discount Type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Discount Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DISCOUNT_TYPES.map(dt => (
              <TouchableOpacity
                key={dt.value}
                style={[styles.typeChip, discountType === dt.value && styles.typeChipActive]}
                onPress={() => setDiscountType(dt.value)}
              >
                <Ionicons name={dt.icon as any} size={16} color={discountType === dt.value ? colors.white : colors.text.secondary} />
                <Text style={[styles.typeChipText, discountType === dt.value && styles.typeChipTextActive]}>{dt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Discount Value */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            {discountType === 'PERCENTAGE' ? 'Percentage (%)' :
             discountType === 'FIXED_AMOUNT' ? 'Amount ($)' :
             discountType === 'BOGO' ? 'Discount on 2nd item (% off, 100 = free)' :
             'Discount Value'}
          </Text>
          <TextInput style={styles.formInput} value={discountValue} onChangeText={setDiscountValue} placeholder="0" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
        </View>

        {/* Item/Category picker for relevant types */}
        {(discountType === 'BOGO' || discountType === 'FREE_ITEM') && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Applicable Item</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.typeChip, !applicableItemId && styles.typeChipActive]}
                onPress={() => setApplicableItemId(null)}
              >
                <Text style={[styles.typeChipText, !applicableItemId && styles.typeChipTextActive]}>Any</Text>
              </TouchableOpacity>
              {menuItems.slice(0, 20).map(mi => (
                <TouchableOpacity
                  key={mi.id}
                  style={[styles.typeChip, applicableItemId === mi.id && styles.typeChipActive]}
                  onPress={() => setApplicableItemId(mi.id)}
                >
                  <Text style={[styles.typeChipText, applicableItemId === mi.id && styles.typeChipTextActive]} numberOfLines={1}>{mi.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {discountType === 'BOGO_CATEGORY' && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Applicable Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.typeChip, applicableCategoryId === c.id && styles.typeChipActive]}
                  onPress={() => setApplicableCategoryId(c.id)}
                >
                  <Text style={[styles.typeChipText, applicableCategoryId === c.id && styles.typeChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Conditions Row */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.formLabel}>Min Order ($)</Text>
            <TextInput style={styles.formInput} value={minOrderAmount} onChangeText={setMinOrderAmount} placeholder="0" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
          </View>
          {discountType === 'PERCENTAGE' && (
            <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.formLabel}>Max Discount ($)</Text>
              <TextInput style={styles.formInput} value={maxDiscount} onChangeText={setMaxDiscount} placeholder="No cap" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />
            </View>
          )}
        </View>

        {/* Usage limits */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.formLabel}>Total Uses Limit</Text>
            <TextInput style={styles.formInput} value={maxTotalUses} onChangeText={setMaxTotalUses} placeholder="Unlimited" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.formLabel}>Per User Limit</Text>
            <TextInput style={styles.formInput} value={maxUsesPerUser} onChangeText={setMaxUsesPerUser} placeholder="1" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" />
          </View>
        </View>

        {/* Expiry */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Expiry Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.formInput} value={expiresAt} onChangeText={setExpiresAt} placeholder="Leave empty for no expiry" placeholderTextColor={colors.text.tertiary} />
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

        {/* Active toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.formLabel}>Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary.main }} />
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <Button
          title={editingItem ? 'Save Changes' : 'Create Promo Code'}
          onPress={handleSubmit}
          disabled={submitting}
          loading={submitting}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandedHeader title="Promo Codes" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading promo codes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandedHeader title="Promo Codes" onBackPress={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} style={{ marginRight: spacing.xs }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => { setLoading(true); loadData(); }}
            placeholder="Search promo codes..."
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setLoading(true); loadData(); }}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={codes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadData(); }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No promo codes yet</Text>
            <Button title="Create First Promo" onPress={openCreate} style={{ marginTop: spacing.md }} />
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { if (step === 'form' && !editingItem) { setStep('template'); } else { setModalVisible(false); } }}>
              <Ionicons name={step === 'form' && !editingItem ? 'arrow-back' : 'close'} size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Promo' : step === 'template' ? 'Choose Template' : 'New Promo Code'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {step === 'template' ? renderTemplateStep() : renderFormStep()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.bodyMedium, color: colors.text.secondary },
  searchContainer: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.lightGray },
  searchInput: { flex: 1, ...typography.bodyMedium, color: colors.text.primary, paddingVertical: spacing.sm },
  addButton: { backgroundColor: colors.primary.main, borderRadius: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md, paddingTop: spacing.xs },
  itemCard: { marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  itemInfo: { flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeText: { ...typography.titleMedium, color: colors.primary.main, fontWeight: '700', letterSpacing: 1 },
  inactiveBadge: { backgroundColor: colors.error + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactiveBadgeText: { ...typography.labelSmall, color: colors.error },
  itemName: { ...typography.bodySmall, color: colors.text.secondary },
  discountLabel: { ...typography.titleMedium, color: colors.success, fontWeight: '600' },
  itemDesc: { ...typography.bodySmall, color: colors.text.tertiary, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaText: { ...typography.labelSmall, color: colors.text.tertiary },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: spacing.sm, marginTop: spacing.xs },
  actionBtn: { padding: spacing.xs },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.text.tertiary },
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  modalTitle: { ...typography.titleLarge, color: colors.text.primary },
  modalFooter: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.lightGray },
  submitButton: { width: '100%' },
  // Template step
  sectionLabel: { ...typography.titleMedium, color: colors.text.primary, marginBottom: 4 },
  sectionHint: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.md },
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.lightGray, gap: spacing.md },
  templateCardHighlight: { borderColor: colors.primary.main, borderWidth: 2 },
  templateInfo: { flex: 1 },
  templateName: { ...typography.bodyLarge, color: colors.text.primary, fontWeight: '600' },
  templateDesc: { ...typography.bodySmall, color: colors.text.secondary },
  // Form
  formScroll: { flex: 1 },
  formContent: { padding: spacing.lg },
  formGroup: { marginBottom: spacing.md },
  formRow: { flexDirection: 'row' },
  formLabel: { ...typography.labelMedium, color: colors.text.secondary, marginBottom: spacing.xs },
  formInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium, color: colors.text.primary },
  formTextArea: { minHeight: 60, textAlignVertical: 'top' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.lightGray, marginRight: spacing.sm },
  typeChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  typeChipText: { ...typography.labelMedium, color: colors.text.secondary },
  typeChipTextActive: { color: colors.white },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
});

export default AdminPromoScreen;
