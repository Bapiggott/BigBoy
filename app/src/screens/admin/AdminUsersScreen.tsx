import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { BrandedHeader, Card } from '../../components';
import { useToast } from '../../store/ToastContext';
import { AccountStackParamList } from '../../navigation/types';
import { AdminUser, getUsers, updateUserRole } from '../../api/endpoints/admin';

type Props = NativeStackScreenProps<AccountStackParamList, 'AdminUsers'>;

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
};

const AdminUsersScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 20;

  const loadUsers = useCallback(async (reset = false) => {
    try {
      const newOffset = reset ? 0 : offset;
      const result = await getUsers({ search: search || undefined, limit: PAGE_SIZE, offset: newOffset });
      if (reset) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }
      setTotal(result.total);
      setHasMore(result.hasMore);
      setOffset(newOffset + result.users.length);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, offset, showToast]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    const timer = setTimeout(() => loadUsers(true), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRoleChange = (user: AdminUser) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const action = newRole === 'ADMIN' ? 'promote to Admin' : 'demote to User';

    Alert.alert(
      'Change Role',
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName} (${user.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newRole === 'ADMIN' ? 'Promote' : 'Demote',
          style: newRole === 'ADMIN' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateUserRole(user.id, newRole);
              showToast(`${user.firstName} is now ${newRole}`, 'success');
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            } catch (error: any) {
              showToast(error.message || 'Failed to update role', 'error');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.firstName?.[0] || '').toUpperCase()}{(item.lastName?.[0] || '').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
            <View style={[styles.roleBadge, item.role === 'ADMIN' && styles.adminBadge]}>
              <Text style={[styles.roleBadgeText, item.role === 'ADMIN' && styles.adminBadgeText]}>{item.role}</Text>
            </View>
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.userEmail}>{item.phone}</Text>}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="star" size={14} color={colors.primary.main} />
          <Text style={styles.statText}>{item.loyaltyPoints.toLocaleString()} pts</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="shield" size={14} color={TIER_COLORS[item.loyaltyTier] || colors.text.tertiary} />
          <Text style={[styles.statText, { color: TIER_COLORS[item.loyaltyTier] || colors.text.tertiary }]}>{item.loyaltyTier}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="receipt-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.statText}>{item.orderCount} orders</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trophy-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.statText}>{item.lifetimePoints.toLocaleString()} lifetime</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.roleButton, item.role === 'ADMIN' ? styles.demoteButton : styles.promoteButton]} onPress={() => handleRoleChange(item)}>
        <Ionicons name={item.role === 'ADMIN' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={18} color={item.role === 'ADMIN' ? colors.error : colors.success} />
        <Text style={[styles.roleButtonText, item.role === 'ADMIN' ? styles.demoteText : styles.promoteText]}>
          {item.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BrandedHeader title="User Management" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BrandedHeader title="User Management" onBackPress={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={colors.text.tertiary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.totalText}>{total} user(s)</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); setOffset(0); loadUsers(true); }}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            setLoadingMore(true);
            loadUsers(false);
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary.main} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>{search ? 'No users found' : 'No users yet'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.lightGray, paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.bodyMedium, color: colors.text.primary, paddingVertical: spacing.sm },
  totalText: { ...typography.labelSmall, color: colors.text.tertiary, marginTop: spacing.xs, textAlign: 'right' },
  listContent: { padding: spacing.md, paddingTop: 0 },
  userCard: { marginBottom: spacing.md },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary.main, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.titleMedium, color: colors.white, fontWeight: '700' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName: { ...typography.titleMedium, color: colors.text.primary },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.lightGray },
  roleBadgeText: { ...typography.labelSmall, color: colors.text.secondary },
  adminBadge: { backgroundColor: colors.primary.main + '20' },
  adminBadgeText: { color: colors.primary.main, fontWeight: '600' },
  userEmail: { ...typography.bodySmall, color: colors.text.tertiary },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.labelSmall, color: colors.text.secondary },
  roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1 },
  promoteButton: { borderColor: colors.success + '40', backgroundColor: colors.success + '10' },
  demoteButton: { borderColor: colors.error + '40', backgroundColor: colors.error + '10' },
  roleButtonText: { ...typography.labelMedium },
  promoteText: { color: colors.success },
  demoteText: { color: colors.error },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.text.tertiary },
});

export default AdminUsersScreen;
