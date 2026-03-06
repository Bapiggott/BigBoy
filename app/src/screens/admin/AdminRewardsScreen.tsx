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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card, Button } from '../../components';
import { useToast } from '../../store/ToastContext';
import { AccountStackParamList } from '../../navigation/types';
import {
  AdminReward,
  CreateRewardRequest,
  getAdminRewards,
  createReward,
  updateReward,
  deleteReward,
  toggleReward,
  getAdminMenuItems,
  AdminMenuItem,
} from '../../api/endpoints/admin';
import { resolveMenuImage, MENU_IMAGE_PLACEHOLDER } from '../../assets/menuImageMap';

type Props = NativeStackScreenProps<AccountStackParamList, 'AdminRewards'>;

const CATEGORIES = [
  { value: 'FOOD', label: 'Food', icon: 'fast-food' as const },
  { value: 'DRINK', label: 'Drink', icon: 'beer' as const },
  { value: 'DESSERT', label: 'Dessert', icon: 'ice-cream' as const },
  { value: 'COMBO', label: 'Combo', icon: 'layers' as const },
  { value: 'MERCHANDISE', label: 'Merch', icon: 'shirt' as const },
];

const TIERS = [
  { value: 'BRONZE', label: 'Bronze', color: '#CD7F32' },
  { value: 'SILVER', label: 'Silver', color: '#C0C0C0' },
  { value: 'GOLD', label: 'Gold', color: '#FFD700' },
];

const AdminRewardsScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminReward | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pointsCost, setPointsCost] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [minTier, setMinTier] = useState('BRONZE');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [result, itemsData] = await Promise.all([
        getAdminRewards(),
        getAdminMenuItems({ limit: 200 }),
      ]);
      setRewards(result);
      setMenuItems(itemsData.items);
    } catch (error) {
      showToast('Failed to load rewards', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setName(''); setDescription(''); setImageUrl(null); setPointsCost(''); setCategory('FOOD');
    setMinTier('BRONZE'); setValidFrom(''); setValidUntil(''); setMaxRedemptions(''); setIsActive(true);
  };

  const openCreate = () => { setEditingItem(null); resetForm(); setModalVisible(true); };

  const openEdit = (item: AdminReward) => {
    setEditingItem(item);
    setName(item.name); setDescription(item.description || '');
    setImageUrl(item.imageUrl || null);
    setPointsCost(String(item.pointsCost)); setCategory(item.category); setMinTier(item.minTier);
    setValidFrom(item.validFrom ? item.validFrom.slice(0, 10) : '');
    setValidUntil(item.validUntil ? item.validUntil.slice(0, 10) : '');
    setMaxRedemptions(item.maxRedemptions ? String(item.maxRedemptions) : '');
    setIsActive(item.isActive);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    if (!pointsCost || isNaN(parseInt(pointsCost))) { showToast('Points cost is required', 'error'); return; }
    if (!description.trim()) { showToast('Description is required', 'error'); return; }

    setSubmitting(true);
    try {
      const data: CreateRewardRequest = {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl || null,
        pointsCost: parseInt(pointsCost),
        category,
        minTier,
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        isActive,
      };

      if (editingItem) {
        await updateReward(editingItem.id, data);
        showToast('Reward updated', 'success');
      } else {
        await createReward(data);
        showToast('Reward created', 'success');
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: AdminReward) => {
    Alert.alert('Delete Reward', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteReward(item.id); showToast('Deleted', 'success'); loadData(); }
          catch { showToast('Failed to delete', 'error'); }
        },
      },
    ]);
  };

  const getTierColor = (tier: string) => TIERS.find(t => t.value === tier)?.color || colors.text.secondary;
  const getCategoryIcon = (cat: string) => CATEGORIES.find(c => c.value === cat)?.icon || 'help-circle';

  const renderItem = ({ item }: { item: AdminReward }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={24} color={colors.primary.main} />
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>Inactive</Text></View>
            )}
          </View>
          {item.description ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="star" size={14} color={colors.primary.main} />
          <Text style={styles.metaBadgeText}>{item.pointsCost.toLocaleString()} pts</Text>
        </View>
        <View style={[styles.metaBadge, { borderColor: getTierColor(item.minTier) }]}>
          <Text style={[styles.metaBadgeText, { color: getTierColor(item.minTier) }]}>{item.minTier}+</Text>
        </View>
        {item.maxRedemptions && (
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{item.totalRedeemed}/{item.maxRedemptions}</Text>
          </View>
        )}
        {!item.maxRedemptions && (
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{item.totalRedeemed} redeemed</Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={async () => { try { await toggleReward(item.id); loadData(); } catch {} }}>
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
        <BrandedHeader title="Rewards" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandedHeader title="Rewards" onBackPress={() => navigation.goBack()} />

      <View style={styles.topBar}>
        <Text style={styles.countText}>{rewards.length} reward(s)</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>New Reward</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadData(); }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No rewards yet</Text>
            <Button title="Create First Reward" onPress={openCreate} style={{ marginTop: spacing.md }} />
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Reward' : 'New Reward'}</Text>
            <View style={{ width: 28 }} />
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="e.g., Free Big Boy Burger" placeholderTextColor={colors.text.tertiary} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput style={[styles.formInput, styles.formTextArea]} value={description} onChangeText={setDescription} placeholder="Describe the reward..." placeholderTextColor={colors.text.tertiary} multiline />
              </View>

              {/* Image Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Image</Text>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => setImagePickerVisible(true)}
                >
                  {imageUrl ? (
                    <Image
                      source={resolveMenuImage({ imageUrl } as any).source}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={colors.text.tertiary} />
                      <Text style={{ ...typography.labelSmall, color: colors.text.tertiary, marginTop: 4 }}>Tap to pick an image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {imageUrl && (
                  <TouchableOpacity onPress={() => setImageUrl(null)} style={{ marginTop: 4 }}>
                    <Text style={{ ...typography.labelSmall, color: colors.error }}>Remove image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Points Cost *</Text>
                <TextInput style={styles.formInput} value={pointsCost} onChangeText={setPointsCost} placeholder="e.g., 500" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.value} style={[styles.categoryChip, category === cat.value && styles.categoryChipActive]} onPress={() => setCategory(cat.value)}>
                      <Ionicons name={cat.icon} size={18} color={category === cat.value ? colors.white : colors.text.secondary} />
                      <Text style={[styles.categoryChipText, category === cat.value && styles.categoryChipTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Minimum Tier</Text>
                <View style={styles.tierRow}>
                  {TIERS.map(t => (
                    <TouchableOpacity key={t.value} style={[styles.tierChip, minTier === t.value && { backgroundColor: t.color + '20', borderColor: t.color }]} onPress={() => setMinTier(t.value)}>
                      <Ionicons name="shield" size={16} color={minTier === t.value ? t.color : colors.text.tertiary} />
                      <Text style={[styles.tierChipText, minTier === t.value && { color: t.color }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Valid From</Text>
                  <TextInput style={styles.formInput} value={validFrom} onChangeText={setValidFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.tertiary} />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.formLabel}>Valid Until</Text>
                  <TextInput style={styles.formInput} value={validUntil} onChangeText={setValidUntil} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.tertiary} />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Max Redemptions</Text>
                <TextInput style={styles.formInput} value={maxRedemptions} onChangeText={setMaxRedemptions} placeholder="Unlimited" placeholderTextColor={colors.text.tertiary} keyboardType="number-pad" />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Active</Text>
                <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary.main }} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={editingItem ? 'Save Changes' : 'Create Reward'}
                onPress={handleSubmit}
                disabled={submitting}
                loading={submitting}
                style={styles.submitButton}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={imagePickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setImagePickerVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setImagePickerVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pick Image</Text>
            <View style={{ width: 28 }} />
          </View>

          <Text style={{ ...typography.bodySmall, color: colors.text.secondary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            Select from menu item images
          </Text>

          <FlatList
            data={menuItems.filter(mi => mi.imageUrl)}
            numColumns={3}
            keyExtractor={mi => mi.id}
            contentContainerStyle={{ padding: spacing.sm }}
            renderItem={({ item: mi }) => {
              const isSelected = imageUrl === mi.imageUrl;
              return (
                <TouchableOpacity
                  style={[styles.imageGridItem, isSelected && styles.imageGridItemSelected]}
                  onPress={() => {
                    setImageUrl(mi.imageUrl);
                    setImagePickerVisible(false);
                  }}
                >
                  <Image
                    source={resolveMenuImage({ imageUrl: mi.imageUrl } as any).source}
                    style={styles.imageGridThumb}
                    resizeMode="cover"
                  />
                  <Text style={styles.imageGridLabel} numberOfLines={1}>{mi.name}</Text>
                  {isSelected && (
                    <View style={styles.imageGridCheck}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No menu images available</Text>
              </View>
            }
          />
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
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary.main + '15', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { ...typography.titleMedium, color: colors.text.primary },
  inactiveBadge: { backgroundColor: colors.error + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactiveBadgeText: { ...typography.labelSmall, color: colors.error },
  itemDesc: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.lightGray },
  metaBadgeText: { ...typography.labelSmall, color: colors.text.secondary },
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
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.lightGray },
  categoryChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  categoryChipText: { ...typography.labelMedium, color: colors.text.secondary },
  categoryChipTextActive: { color: colors.white },
  tierRow: { flexDirection: 'row', gap: spacing.sm },
  tierChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.lightGray, backgroundColor: colors.white },
  tierChipText: { ...typography.labelMedium, color: colors.text.tertiary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  // Image picker
  imagePickerBtn: { borderWidth: 1, borderColor: colors.lightGray, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.white },
  imagePreview: { width: '100%', height: 120, borderRadius: 8 },
  imagePlaceholder: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  imageGridItem: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.white },
  imageGridItemSelected: { borderColor: colors.primary.main },
  imageGridThumb: { width: '100%', aspectRatio: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  imageGridLabel: { ...typography.labelSmall, color: colors.text.secondary, padding: 4, textAlign: 'center' },
  imageGridCheck: { position: 'absolute', top: 4, right: 4 },
});

export default AdminRewardsScreen;
