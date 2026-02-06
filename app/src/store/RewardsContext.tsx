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

export type RewardCoupon = {
  id: string;
  rewardId?: string;
  title: string;
  code?: string;
  discountType: 'FREE_ITEM' | 'PERCENT' | 'FIXED';
  value: number;
  match?: string;
  createdAt: string;
  status: 'available' | 'applied' | 'used';
};

export type RedeemableReward = {
  id: string;
  name: string;
  pointsCost: number;
};

type RewardsContextValue = {
  redemptions: RewardRedemption[];
  coupons: RewardCoupon[];
  appliedCouponId: string | null;
  appliedCoupon: RewardCoupon | null;
  points: number;
  redeemReward: (reward: RedeemableReward) => Promise<void>;
  applyCoupon: (couponId: string | null) => void;
  activeCoupons: RewardCoupon[];
  promoCoupons: RewardCoupon[];
};

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

type RewardsProviderProps = {
  children: ReactNode;
};

export const RewardsProvider = ({ children }: RewardsProviderProps) => {
  const { user } = useUser();
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [coupons, setCoupons] = useState<RewardCoupon[]>([]);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const promoCoupons: RewardCoupon[] = useMemo(
    () => [
      {
        id: 'promo-seafood',
        title: 'Seafood Fest',
        code: 'SEAFOOD',
        discountType: 'PERCENT',
        value: 10,
        createdAt: 'promo',
        status: 'available',
      },
      {
        id: 'promo-birthday',
        title: 'Birthday Treat',
        code: 'BIRTHDAY',
        discountType: 'FIXED',
        value: 5,
        createdAt: 'promo',
        status: 'available',
      },
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      const savedRedemptions = await storage.get<RewardRedemption[]>(STORAGE_KEYS.REWARD_REDEMPTIONS);
      if (savedRedemptions && Array.isArray(savedRedemptions)) {
        setRedemptions(savedRedemptions);
      }
      const savedCoupons = await storage.get<RewardCoupon[]>(STORAGE_KEYS.REWARD_COUPONS);
      if (savedCoupons && Array.isArray(savedCoupons)) {
        setCoupons(savedCoupons);
      }
      const savedApplied = await storage.get<string>(STORAGE_KEYS.APPLIED_COUPON_ID);
      if (savedApplied) setAppliedCouponId(savedApplied);
      const savedPoints = await storage.get<number>(STORAGE_KEYS.REWARD_POINTS);
      const basePoints =
        typeof savedPoints === 'number' ? savedPoints : user?.loyaltyStatus?.currentPoints ?? 0;
      if (__DEV__ && basePoints === 0 && user?.email?.toLowerCase().includes('john')) {
        setPoints(1250);
      } else {
        setPoints(basePoints);
      }
      setHasLoaded(true);
    };
    load();
  }, [user]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.REWARD_REDEMPTIONS, redemptions);
  }, [redemptions]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.REWARD_COUPONS, coupons);
  }, [coupons]);

  useEffect(() => {
    if (appliedCouponId) {
      storage.set(STORAGE_KEYS.APPLIED_COUPON_ID, appliedCouponId);
    } else {
      storage.remove(STORAGE_KEYS.APPLIED_COUPON_ID);
    }
  }, [appliedCouponId]);

  useEffect(() => {
    if (hasLoaded) {
      storage.set(STORAGE_KEYS.REWARD_POINTS, points);
    }
  }, [hasLoaded, points]);

  const createCouponForReward = (reward: RedeemableReward): RewardCoupon => {
    const lower = reward.name.toLowerCase();
    const match =
      lower.includes('fries') ? 'fries' :
      lower.includes('salad') ? 'salad' :
      lower.includes('burger') ? 'burger' :
      lower.includes('shake') ? 'shake' :
      lower.includes('dessert') || lower.includes('pie') ? 'dessert' :
      undefined;

    return {
      id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      rewardId: reward.id,
      title: reward.name,
      discountType: lower.includes('free') ? 'FREE_ITEM' : 'FIXED',
      value: lower.includes('free') ? 0 : 2,
      match,
      createdAt: new Date().toISOString(),
      status: 'available',
    };
  };

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
    const coupon = createCouponForReward(reward);
    setRedemptions((prev) => [...prev, redemption]);
    setCoupons((prev) => [...prev, coupon]);
    setPoints((prev) => Math.max(0, prev - reward.pointsCost));
  };

  const applyCoupon = (couponId: string | null) => {
    setAppliedCouponId(couponId);
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId
          ? { ...c, status: 'applied' }
          : c.status === 'applied'
            ? { ...c, status: 'available' }
            : c
      )
    );
  };

  const activeCoupons = useMemo(
    () => [...coupons.filter((c) => c.status !== 'used'), ...promoCoupons],
    [coupons, promoCoupons]
  );

  const appliedCoupon = useMemo(
    () => activeCoupons.find((c) => c.id === appliedCouponId) ?? null,
    [activeCoupons, appliedCouponId]
  );

  useEffect(() => {
    if (appliedCouponId && !activeCoupons.find((c) => c.id === appliedCouponId)) {
      setAppliedCouponId(null);
    }
  }, [activeCoupons, appliedCouponId]);

  return (
    <RewardsContext.Provider
      value={{
        redemptions,
        coupons,
        appliedCouponId,
        appliedCoupon,
        points,
        redeemReward,
        applyCoupon,
        activeCoupons,
        promoCoupons,
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
