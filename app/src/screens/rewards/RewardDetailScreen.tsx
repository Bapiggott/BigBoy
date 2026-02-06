import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { BrandedHeader, Card, Button, LoadingScreen } from '../../components';
import { useRewards, useToast } from '../../store';
import { Reward } from '../../types';
import * as rewardsApi from '../../api/endpoints/rewards';
import { getRewardImage } from '../../assets/rewardImages';

type Props = NativeStackScreenProps<{ RewardDetail: { rewardId: string } }, 'RewardDetail'>;

const RewardDetailScreen = ({ route }: Props) => {
  const { rewardId } = route.params;
  const navigation = useNavigation();
  const { points, redeemReward } = useRewards();
  const { showToast } = useToast();

  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const userPoints = points;

  const fetchReward = useCallback(async () => {
    try {
      const data = await rewardsApi.getReward(rewardId);
      setReward(data);
    } catch (error) {
      console.error('Failed to fetch reward:', error);
    } finally {
      setIsLoading(false);
    }
  }, [rewardId]);

  useEffect(() => {
    fetchReward();
  }, [fetchReward]);

  const handleRedeem = () => {
    if (!reward) return;

    if (userPoints < reward.pointsCost) {
      showToast('Not enough points', 'error');
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.name}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setIsRedeeming(true);
            try {
              await redeemReward({ id: reward.id, name: reward.name, pointsCost: reward.pointsCost });
              showToast('Reward redeemed! Check My Coupons.', 'success');
              navigation.goBack();
            } catch (error) {
              console.error('Redeem failed:', error);
              showToast('Something went wrong. Please try again.', 'error');
            } finally {
              setIsRedeeming(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading reward..." />;
  }

  if (!reward) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.errorText}>Reward not found</Text>
      </View>
    );
  }

  const canRedeem = userPoints >= reward.pointsCost;
  const pointsNeeded = reward.pointsCost - userPoints;

  return (
    <View style={styles.container}>
      <BrandedHeader title="Reward" showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Image source={getRewardImage(reward)} style={styles.rewardImage} resizeMode="cover" />

        {/* Reward Info */}
        <Text style={styles.name}>{reward.name}</Text>
        <Text style={styles.description}>{reward.description}</Text>

        {/* Points Cost */}
        <Card style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View style={styles.pointsInfo}>
              <Ionicons name="star" size={24} color={colors.gold} />
              <Text style={styles.pointsCost}>{reward.pointsCost} points</Text>
            </View>
            {canRedeem ? (
              <View style={styles.canRedeemBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.canRedeemText}>You can redeem this!</Text>
              </View>
            ) : (
              <Text style={styles.needMoreText}>
                Need {pointsNeeded} more points
              </Text>
            )}
          </View>

          {/* Points Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (userPoints / reward.pointsCost) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {userPoints} / {reward.pointsCost} points
            </Text>
          </View>
        </Card>

        {/* Terms & Conditions */}
        <Card style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <View style={styles.termItem}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.termText}>Valid for 30 days after redemption</Text>
          </View>
          <View style={styles.termItem}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.termText}>One reward per order</Text>
          </View>
          <View style={styles.termItem}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.termText}>Cannot be combined with other offers</Text>
          </View>
          <View style={styles.termItem}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.termText}>Available at all participating locations</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Redeem Button */}
      <View style={styles.footer}>
        <Button
          title={
            canRedeem
              ? `Redeem for ${reward.pointsCost} Points`
              : `Need ${pointsNeeded} More Points`
          }
          onPress={handleRedeem}
          disabled={!canRedeem}
          loading={isRedeeming}
        />
      </View>
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
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  rewardImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  name: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  pointsCard: {
    marginBottom: spacing.lg,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pointsCost: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  canRedeemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.semantic.success + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  canRedeemText: {
    ...typography.labelSmall,
    color: colors.success,
    fontWeight: '600',
  },
  needMoreText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  progressText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  termsCard: {
    backgroundColor: colors.warmGray,
  },
  termsTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  termText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default RewardDetailScreen;
