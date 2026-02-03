import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Card, LoadingScreen, OfflineBanner } from '../../components';
import { useUser, useNetwork } from '../../store';
import { Reward } from '../../types';
import { RewardsStackParamList } from '../../navigation/types';
import * as rewardsApi from '../../api/endpoints/rewards';

type RewardsNavigation = NativeStackNavigationProp<RewardsStackParamList, 'Rewards'>;

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
];

const RewardsScreen: React.FC = () => {
  const navigation = useNavigation<RewardsNavigation>();
  const { user } = useUser();
  const { isOffline } = useNetwork();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userPoints = user?.loyaltyStatus?.currentPoints ?? 0;
  const userTier = user?.loyaltyStatus?.tier ?? 'bronze';
  const pointsToNextTier = user?.loyaltyStatus?.pointsToNextTier ?? 1000;

  const fetchRewards = useCallback(async () => {
    try {
      const data = await rewardsApi.getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
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

  const filteredRewards = selectedCategory === 'all'
    ? rewards
    : rewards.filter(r => r.category.toLowerCase() === selectedCategory);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return colors.gold;
      case 'silver': return colors.silver;
      default: return colors.bronze;
    }
  };

  const getTierProgress = () => {
    if (userTier === 'gold') return 100;
    const currentTierPoints = userTier === 'bronze' ? 0 : 1000;
    const nextTierPoints = userTier === 'bronze' ? 1000 : 2500;
    const lifetimePoints = user?.loyaltyStatus?.lifetimePoints ?? 0;
    return Math.min(100, ((lifetimePoints - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100);
  };

  const renderRewardCard = ({ item }: { item: Reward }) => {
    const canRedeem = userPoints >= item.pointsCost;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('RewardDetail', { rewardId: item.id })}
        activeOpacity={0.7}
      >
        <Card style={[styles.rewardCard, !canRedeem ? styles.rewardCardDisabled : undefined]}>
          <View style={styles.rewardHeader}>
            <View style={styles.rewardIcon}>
              <Ionicons
                name={item.category === 'food' ? 'restaurant' : item.category === 'drink' ? 'cafe' : 'ice-cream'}
                size={24}
                color={canRedeem ? colors.primary.main : colors.text.tertiary}
              />
            </View>
            <View style={styles.rewardInfo}>
              <Text style={[styles.rewardName, !canRedeem && styles.rewardNameDisabled]}>
                {item.name}
              </Text>
              <Text style={styles.rewardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </View>
          <View style={styles.rewardFooter}>
            <View style={styles.pointsCost}>
              <Ionicons
                name="star"
                size={16}
                color={canRedeem ? colors.gold : colors.text.tertiary}
              />
              <Text style={[styles.pointsText, !canRedeem && styles.pointsTextDisabled]}>
                {item.pointsCost} pts
              </Text>
            </View>
            {!canRedeem && (
              <Text style={styles.needMorePoints}>
                Need {item.pointsCost - userPoints} more
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading rewards..." />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        stickyHeaderIndices={[1]}
      >
        {/* Points Card */}
        <Card style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={styles.pointsLabel}>Your Points</Text>
              <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.myRewardsButton}
              onPress={() => navigation.navigate('MyRewards')}
            >
              <Ionicons name="gift-outline" size={20} color={colors.primary.main} />
              <Text style={styles.myRewardsText}>My Rewards</Text>
            </TouchableOpacity>
          </View>

          {/* Tier Progress */}
          <View style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <View style={styles.tierBadge}>
                <Ionicons
                  name="shield"
                  size={16}
                  color={getTierColor(userTier)}
                />
                <Text style={[styles.tierText, { color: getTierColor(userTier) }]}>
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                </Text>
              </View>
              {userTier !== 'gold' && (
                <Text style={styles.nextTierText}>
                  {pointsToNextTier} pts to {userTier === 'bronze' ? 'Silver' : 'Gold'}
                </Text>
              )}
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getTierProgress()}%`, backgroundColor: getTierColor(userTier) },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Category Tabs */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.id && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Rewards List */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Rewards' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Rewards`}
          </Text>
          {filteredRewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No rewards in this category</Text>
            </View>
          ) : (
            filteredRewards.map((reward) => (
              <View key={reward.id}>
                {renderRewardCard({ item: reward })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
  pointsCard: {
    margin: spacing.lg,
    backgroundColor: colors.primary.main,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  pointsLabel: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.9,
  },
  pointsValue: {
    ...typography.displayMedium,
    color: colors.white,
    marginTop: spacing.xxs,
  },
  myRewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  myRewardsText: {
    ...typography.labelMedium,
    color: colors.primary.main,
    fontWeight: '600',
  },
  tierSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: spacing.md,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tierText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  nextTierText: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
  },
  categoryTabs: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  categoryTabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  rewardsSection: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  rewardCard: {
    marginBottom: spacing.md,
  },
  rewardCardDisabled: {
    opacity: 0.7,
  },
  rewardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  rewardNameDisabled: {
    color: colors.text.secondary,
  },
  rewardDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    ...typography.titleSmall,
    color: colors.gold,
  },
  pointsTextDisabled: {
    color: colors.text.tertiary,
  },
  needMorePoints: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
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
});

export default RewardsScreen;
