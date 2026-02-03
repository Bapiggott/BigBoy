import { apiClient } from '../client';
import { Reward, UserReward, LoyaltyStatus } from '../../types';
import { RedeemRewardRequest, RedeemRewardResponse } from '../types';
import { mockRewards, loyaltyTiers } from '../../data/mockRewards';

/**
 * Rewards API Endpoints
 * Currently returns mock data - swap implementation when backend is ready
 */

const USE_MOCK = true;

// Mock user rewards (redeemed rewards)
let mockUserRewards: UserReward[] = [];

/**
 * Get all available rewards
 */
export const getRewards = async (): Promise<Reward[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRewards.filter(r => r.isAvailable);
  }

  const response = await apiClient.get<{ rewards: Reward[] }>('/rewards');
  return response.success && response.data ? response.data.rewards : [];
};

/**
 * Get a single reward by ID
 */
export const getReward = async (rewardId: string): Promise<Reward | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockRewards.find(r => r.id === rewardId) ?? null;
  }

  const response = await apiClient.get<{ reward: Reward }>(`/rewards/${rewardId}`);
  return response.success ? response.data?.reward ?? null : null;
};

/**
 * Get rewards by category
 */
export const getRewardsByCategory = async (category: string): Promise<Reward[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRewards.filter(r => r.category === category && r.isAvailable);
  }

  const response = await apiClient.get<{ rewards: Reward[] }>(`/rewards?category=${category}`);
  return response.success && response.data ? response.data.rewards : [];
};

/**
 * Get user's redeemed rewards
 */
export const getUserRewards = async (): Promise<UserReward[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUserRewards.filter(ur => !ur.isUsed);
  }

  const response = await apiClient.get<{ rewards: UserReward[] }>('/rewards/user/my');
  return response.success && response.data ? response.data.rewards : [];
};

/**
 * Redeem a reward
 */
export const redeemReward = async (rewardId: string): Promise<RedeemRewardResponse | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const reward = mockRewards.find(r => r.id === rewardId);
    if (!reward) return null;

    // Generate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate redemption code
    const code = `BB${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Add to user rewards
    const userReward: UserReward = {
      id: `ur-${Date.now()}`,
      reward,
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
      code,
    };
    mockUserRewards.push(userReward);

    return {
      userRewardId: userReward.id,
      code,
      expiresAt: expiresAt.toISOString(),
    };
  }

  const response = await apiClient.post<{ userReward: RedeemRewardResponse }>('/rewards/redeem', {
    rewardId,
  } as RedeemRewardRequest);

  return response.success ? response.data?.userReward ?? null : null;
};

/**
 * Mark a user reward as used
 */
export const useReward = async (userRewardId: string): Promise<boolean> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockUserRewards.findIndex(ur => ur.id === userRewardId);
    if (index !== -1) {
      mockUserRewards[index] = {
        ...mockUserRewards[index],
        isUsed: true,
        usedAt: new Date().toISOString(),
      };
      return true;
    }
    return false;
  }

  const response = await apiClient.put(`/rewards/user/my/${userRewardId}/use`);
  return response.success;
};

/**
 * Get user's loyalty status
 */
export const getLoyaltyStatus = async (): Promise<LoyaltyStatus | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      currentPoints: 785,
      lifetimePoints: 1785,
      tier: 'silver',
      pointsToNextTier: 715,
      memberSince: '2022-03-15',
    };
  }

  const response = await apiClient.get<{ loyalty: LoyaltyStatus }>('/users/loyalty');
  return response.success ? response.data?.loyalty ?? null : null;
};

/**
 * Get tier information
 */
export const getTierInfo = (tier: 'bronze' | 'silver' | 'gold') => {
  return loyaltyTiers[tier];
};

/**
 * Get all tier information
 */
export const getAllTierInfo = () => {
  return loyaltyTiers;
};

/**
 * Get rewards available for user's current points
 */
export const getAffordableRewards = async (currentPoints: number): Promise<Reward[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRewards.filter(r => r.isAvailable && r.pointsCost <= currentPoints);
  }

  const response = await apiClient.get<{ rewards: Reward[] }>(`/rewards?maxPoints=${currentPoints}`);
  return response.success && response.data ? response.data.rewards : [];
};
