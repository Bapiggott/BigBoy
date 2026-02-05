import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useUser } from './UserContext';

export type RewardRedemption = {
  redemptionId: string;
  rewardId: string;
  title: string;
  cost: number;
  createdAt: string;
  status: 'active' | 'used';
};

export type RedeemableReward = {
  id: string;
  name: string;
  pointsCost: number;
};

type RewardsContextValue = {
  redemptions: RewardRedemption[];
  activeRedemptions: RewardRedemption[];
  appliedRedemptionId: string | null;
  points: number;
  redeemReward: (reward: RedeemableReward) => Promise<void>;
  applyRedemption: (redemptionId: string | null) => void;
};

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

type RewardsProviderProps = {
  children: ReactNode;
};

export const RewardsProvider = ({ children }: RewardsProviderProps) => {
  const { user } = useUser();
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [appliedRedemptionId, setAppliedRedemptionId] = useState<string | null>(null);
  const [pointsDelta, setPointsDelta] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const savedRedemptions = await storage.get<RewardRedemption[]>(STORAGE_KEYS.REWARD_REDEMPTIONS);
      if (savedRedemptions && Array.isArray(savedRedemptions)) {
        setRedemptions(savedRedemptions);
      }
      const savedApplied = await storage.getString(STORAGE_KEYS.APPLIED_REWARD_ID);
      if (savedApplied) setAppliedRedemptionId(savedApplied);
      const savedDelta = await storage.get<number>(STORAGE_KEYS.REWARD_POINTS_DELTA);
      if (typeof savedDelta === 'number') setPointsDelta(savedDelta);
    };
    load();
  }, []);

  useEffect(() => {
    storage.set(STORAGE_KEYS.REWARD_REDEMPTIONS, redemptions);
  }, [redemptions]);

  useEffect(() => {
    if (appliedRedemptionId) {
      storage.setString(STORAGE_KEYS.APPLIED_REWARD_ID, appliedRedemptionId);
    } else {
      storage.remove(STORAGE_KEYS.APPLIED_REWARD_ID);
    }
  }, [appliedRedemptionId]);

  useEffect(() => {
    if (appliedRedemptionId && !redemptions.find((r) => r.redemptionId === appliedRedemptionId)) {
      setAppliedRedemptionId(null);
    }
  }, [redemptions, appliedRedemptionId]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.REWARD_POINTS_DELTA, pointsDelta);
  }, [pointsDelta]);

  const basePoints = user?.loyaltyStatus?.currentPoints ?? 0;
  const points = Math.max(0, basePoints + pointsDelta);

  const redeemReward = async (reward: RedeemableReward) => {
    if (points < reward.pointsCost) return;
    const redemption: RewardRedemption = {
      redemptionId: `red-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      rewardId: reward.id,
      title: reward.name,
      cost: reward.pointsCost,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setRedemptions((prev) => [...prev, redemption]);
    setPointsDelta((prev) => prev - reward.pointsCost);
  };

  const applyRedemption = (redemptionId: string | null) => {
    setAppliedRedemptionId(redemptionId);
  };

  const activeRedemptions = useMemo(
    () => redemptions.filter((r) => r.status === 'active'),
    [redemptions]
  );

  return (
    <RewardsContext.Provider
      value={{
        redemptions,
        activeRedemptions,
        appliedRedemptionId,
        points,
        redeemReward,
        applyRedemption,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};
