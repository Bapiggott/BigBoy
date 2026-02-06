import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { BrandedHeader, CheckerStrip, Card, LoadingScreen, OfflineBanner } from '../../components';
import { useRewards, useToast } from '../../store';
import { Reward } from '../../types';
import { RewardsStackParamList } from '../../navigation/types';
import * as rewardsApi from '../../api/endpoints/rewards';
import { getRewardImage } from '../../assets/rewardImages';

type RewardsNavigation = NativeStackNavigationProp<RewardsStackParamList, 'Rewards'>;

const RewardsScreen: React.FC = () => {
  const navigation = useNavigation<RewardsNavigation>();
  const { points, coupons, promoCoupons, appliedCouponId, applyCoupon } = useRewards();
  const { showToast } = useToast();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tiersVisible, setTiersVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem' | 'coupons'>('redeem');

  const fetchRewards = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await rewardsApi.getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      setErrorMessage('Failed to load rewards.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRewards();
  };

  const rewardCoupons = useMemo(() => coupons, [coupons]);

  const renderRewardCard = ({ item }: { item: Reward }) => {
    const canRedeem = points >= item.pointsCost;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('RewardDetail', { rewardId: item.id })}
        activeOpacity={0.7}
        style={styles.rewardCard}
      >
        <Card style={[styles.rewardCardInner, !canRedeem && styles.rewardCardDisabled]}>
          <Image source={getRewardImage(item)} style={styles.rewardImage} resizeMode="cover" />
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.pointsText}>{item.pointsCost} pts</Text>
          </View>
          <View style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}>
            <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
              Redeem
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading rewards..." />;
  }

  const renderCouponCard = (coupon: typeof rewardCoupons[number]) => {
    const isApplied = appliedCouponId === coupon.id;
    return (
      <Card key={coupon.id} style={styles.couponCard}>
        <View style={styles.couponHeader}>
          <Text style={styles.couponTitle}>{coupon.title}</Text>
          {coupon.code ? <Text style={styles.couponCode}>{coupon.code}</Text> : null}
        </View>
        <Text style={styles.couponDesc}>
          {coupon.discountType === 'FREE_ITEM'
            ? `Free item${coupon.match ? `: ${coupon.match}` : ''}`
            : coupon.discountType === 'PERCENT'
              ? `${coupon.value}% off`
              : `$${coupon.value.toFixed(2)} off`}
        </Text>
        <TouchableOpacity
          style={[styles.applyButton, isApplied && styles.applyButtonApplied]}
          onPress={() => {
            applyCoupon(isApplied ? null : coupon.id);
            showToast(isApplied ? 'Coupon removed' : 'Coupon applied to cart', 'success');
          }}
        >
          <Text style={[styles.applyButtonText, isApplied && styles.applyButtonTextApplied]}>
            {isApplied ? 'Applied' : 'Apply to cart'}
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OfflineBanner />
      <BrandedHeader title="Rewards" />
      <CheckerStrip />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.pointsCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('earn');
            setTiersVisible(true);
          }}
        >
          <View style={styles.pointsCardRow}>
            <View>
              <Text style={styles.pointsLabel}>Your Points</Text>
              <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
            </View>
            <View style={styles.pointsTierChip}>
              <Ionicons name="star" size={16} color={colors.white} />
              <Text style={styles.pointsTierText}>View Tiers</Text>
            </View>
          </View>
          <Text style={styles.pointsSubtext}>Tap to see tiers & benefits</Text>
        </TouchableOpacity>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'earn' && styles.tabButtonActive]}
            onPress={() => setActiveTab('earn')}
          >
            <Text style={[styles.tabText, activeTab === 'earn' && styles.tabTextActive]}>Earn & Tiers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'redeem' && styles.tabButtonActive]}
            onPress={() => setActiveTab('redeem')}
          >
            <Text style={[styles.tabText, activeTab === 'redeem' && styles.tabTextActive]}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'coupons' && styles.tabButtonActive]}
            onPress={() => setActiveTab('coupons')}
          >
            <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>My Coupons</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'earn' && (
          <View style={styles.earnSection}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <Text style={styles.earnText}>
              Earn points on every order and redeem them for free favorites. Points and tiers are examples and may vary by location.
            </Text>
            <View style={styles.tierCard}>
              <Text style={styles.tierTitle}>Bronze — Diner Regular</Text>
              <Text style={styles.tierDesc}>0–999 points • Bonus points days • Birthday treat</Text>
            </View>
            <View style={styles.tierCard}>
              <Text style={styles.tierTitle}>Silver — Big Boy VIP</Text>
              <Text style={styles.tierDesc}>1,000–4,999 points • 2x points weekends • Free upgrade</Text>
            </View>
            <View style={styles.tierCard}>
              <Text style={styles.tierTitle}>Gold — Legend</Text>
              <Text style={styles.tierDesc}>5,000+ points • 3x points days • Surprise rewards</Text>
            </View>
          </View>
        )}

        {activeTab === 'redeem' && (
          <View>
            <Text style={styles.sectionTitle}>Rewards Catalog</Text>
            {rewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>
                  {errorMessage ? errorMessage : 'No rewards available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={rewards}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContent}
                renderItem={renderRewardCard}
                scrollEnabled={false}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
              />
            )}
          </View>
        )}

        {activeTab === 'coupons' && (
          <View>
            <Text style={styles.sectionTitle}>My Coupons</Text>
            {rewardCoupons.length === 0 ? (
              <Text style={styles.emptyText}>Redeem rewards to unlock coupons.</Text>
            ) : (
              rewardCoupons.map(renderCouponCard)
            )}

            <Text style={styles.sectionTitle}>Promo Codes</Text>
            {promoCoupons.map(renderCouponCard)}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={tiersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTiersVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setTiersVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tiers & Benefits</Text>
              <TouchableOpacity onPress={() => setTiersVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalCaption}>Example tiers</Text>
            <View style={styles.tierItem}>
              <Text style={styles.tierName}>Bronze — Diner Regular</Text>
              <Text style={styles.tierDesc}>0–999 points • Bonus points days • Birthday treat • Member offers</Text>
            </View>
            <View style={styles.tierItem}>
              <Text style={styles.tierName}>Silver — Big Boy VIP</Text>
              <Text style={styles.tierDesc}>1,000–4,999 points • 2x points weekends • Free upgrade • Early promos</Text>
            </View>
            <View style={styles.tierItem}>
              <Text style={styles.tierName}>Gold — Legend</Text>
              <Text style={styles.tierDesc}>5,000+ points • 3x points days • Free dessert • Surprise rewards</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  earnSection: {
    gap: spacing.sm,
  },
  earnText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tierTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    fontWeight: '700',
  },
  tierDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  gridContent: {
    gap: spacing.lg,
  },
  headerContent: {
    gap: spacing.sm,
  },
  pointsCard: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  pointsCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    ...typography.labelLarge,
    color: colors.white,
  },
  pointsValue: {
    ...typography.displaySmall,
    color: colors.white,
    fontWeight: '800',
  },
  pointsTierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pointsTierText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  pointsSubtext: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.sm,
  },
  gridRow: {
    gap: spacing.md,
  },
  rewardCard: {
    flex: 1,
  },
  rewardCardInner: {
    padding: 0,
    overflow: 'hidden',
    ...shadows.sm,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardImage: {
    width: '100%',
    height: 110,
  },
  rewardInfo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  rewardName: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  pointsText: {
    ...typography.labelLarge,
    color: colors.primary.main,
    fontWeight: '700',
  },
  redeemButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: colors.border.main,
  },
  redeemButtonText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  redeemButtonTextDisabled: {
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  couponCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  couponCode: {
    ...typography.labelSmall,
    color: colors.primary.main,
    fontWeight: '700',
  },
  couponDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  applyButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.main,
    alignSelf: 'flex-start',
  },
  applyButtonApplied: {
    backgroundColor: colors.primary.main,
  },
  applyButtonText: {
    ...typography.labelSmall,
    color: colors.primary.main,
    fontWeight: '600',
  },
  applyButtonTextApplied: {
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    fontWeight: '700',
  },
  modalCaption: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  tierItem: {
    gap: spacing.xs,
  },
  tierName: {
    ...typography.labelLarge,
    color: colors.text.primary,
    fontWeight: '700',
  },
  tierDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

export default RewardsScreen;
