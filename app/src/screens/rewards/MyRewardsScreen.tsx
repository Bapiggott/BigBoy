import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, LoadingScreen } from '../../components';
import { UserReward } from '../../types';
import * as rewardsApi from '../../api/endpoints/rewards';

const MyRewardsScreen: React.FC = () => {
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'used'>('active');

  const fetchUserRewards = useCallback(async () => {
    try {
      const data = await rewardsApi.getUserRewards();
      setUserRewards(data);
    } catch (error) {
      console.error('Failed to fetch user rewards:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRewards();
  }, [fetchUserRewards]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchUserRewards();
  };

  const filteredRewards = userRewards.filter(ur => {
    if (filter === 'active') {
      return !ur.isUsed && new Date(ur.expiresAt) > new Date();
    }
    return ur.isUsed;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderRewardItem = ({ item }: { item: UserReward }) => {
    const daysLeft = getDaysUntilExpiry(item.expiresAt);
    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
    const isExpired = daysLeft <= 0;

    return (
      <Card style={[styles.rewardCard, item.isUsed ? styles.rewardCardUsed : undefined]}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardIcon}>
            <Ionicons
              name={item.isUsed ? 'checkmark-circle' : 'gift'}
              size={24}
              color={item.isUsed ? colors.success : colors.primary.main}
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardName, item.isUsed && styles.rewardNameUsed]}>
              {item.reward.name}
            </Text>
            <Text style={styles.rewardDescription}>
              {item.reward.description}
            </Text>
          </View>
        </View>

        {/* Code Section */}
        {!item.isUsed && item.code && (
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Redemption Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.rewardFooter}>
          {item.isUsed ? (
            <View style={styles.usedBadge}>
              <Ionicons name="checkmark" size={14} color={colors.success} />
              <Text style={styles.usedText}>
                Used on {item.redeemedAt ? formatDate(item.redeemedAt) : 'N/A'}
              </Text>
            </View>
          ) : isExpired ? (
            <View style={styles.expiredBadge}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          ) : (
            <View style={[styles.expiryBadge, isExpiringSoon && styles.expiryBadgeWarning]}>
              <Ionicons
                name="time-outline"
                size={14}
                color={isExpiringSoon ? colors.warning : colors.text.secondary}
              />
              <Text style={[styles.expiryText, isExpiringSoon && styles.expiryTextWarning]}>
                {daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft} days`}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your rewards..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'used' && styles.filterTabActive]}
          onPress={() => setFilter('used')}
        >
          <Text style={[styles.filterText, filter === 'used' && styles.filterTextActive]}>
            Used
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRewards}
        keyExtractor={(item) => item.id}
        renderItem={renderRewardItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={filter === 'active' ? 'gift-outline' : 'checkbox-outline'}
              size={64}
              color={colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>
              {filter === 'active' ? 'No Active Rewards' : 'No Used Rewards'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'active'
                ? 'Redeem points to get rewards'
                : 'Your used rewards will appear here'}
            </Text>
          </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterText: {
    ...typography.labelLarge,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  rewardCard: {
    marginBottom: spacing.md,
  },
  rewardCardUsed: {
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
  rewardNameUsed: {
    color: colors.text.secondary,
  },
  rewardDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  codeSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  codeLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  codeBox: {
    backgroundColor: colors.warmGray,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  codeText: {
    ...typography.headlineSmall,
    color: colors.primary.main,
    letterSpacing: 2,
    fontWeight: '700',
  },
  rewardFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  usedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  usedText: {
    ...typography.bodySmall,
    color: colors.success,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiredText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiryBadgeWarning: {},
  expiryText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  expiryTextWarning: {
    color: colors.warning,
    fontWeight: '500',
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
});

export default MyRewardsScreen;
