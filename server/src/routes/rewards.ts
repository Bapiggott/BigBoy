import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

const TIER_ORDER = { BRONZE: 0, SILVER: 1, GOLD: 2 };

/**
 * GET /api/rewards
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tier } = req.query;
    
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { validFrom: null },
        { validFrom: { lte: new Date() } },
      ],
      AND: [
        {
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
          ],
        },
      ],
    };
    
    if (category) {
      where.category = category as string;
    }
    
    if (tier) {
      const tierLevel = TIER_ORDER[tier as keyof typeof TIER_ORDER] ?? 0;
      where.minTier = {
        in: Object.entries(TIER_ORDER)
          .filter(([, level]) => level <= tierLevel)
          .map(([t]) => t),
      };
    }
    
    const rewards = await prisma.reward.findMany({
      where,
      orderBy: [{ category: 'asc' }, { pointsCost: 'asc' }],
    });
    
    res.json({
      rewards: rewards.map(formatReward),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rewards/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const reward = await prisma.reward.findUnique({
      where: { id },
    });
    
    if (!reward || !reward.isActive) {
      throw createError('Reward not found', 404, 'REWARD_NOT_FOUND');
    }
    
    res.json({ reward: formatReward(reward) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rewards/:id/redeem
 */
router.post('/:id/redeem', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const reward = await prisma.reward.findUnique({
      where: { id },
    });
    
    if (!reward || !reward.isActive) {
      throw createError('Reward not found', 404);
    }
    
    const now = new Date();
    if (reward.validFrom && reward.validFrom > now) {
      throw createError('Reward is not yet available', 400);
    }
    if (reward.validUntil && reward.validUntil < now) {
      throw createError('Reward has expired', 400);
    }
    
    if (reward.maxRedemptions && reward.totalRedeemed >= reward.maxRedemptions) {
      throw createError('Reward is no longer available', 400);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const userTierLevel = TIER_ORDER[user.loyaltyTier as keyof typeof TIER_ORDER];
    const requiredTierLevel = TIER_ORDER[reward.minTier as keyof typeof TIER_ORDER];
    
    if (userTierLevel < requiredTierLevel) {
      throw createError(`This reward requires ${reward.minTier} tier or higher`, 400, 'TIER_REQUIRED');
    }
    
    if (user.loyaltyPoints < reward.pointsCost) {
      throw createError(
        `Not enough points. You have ${user.loyaltyPoints} points but need ${reward.pointsCost}`,
        400,
        'INSUFFICIENT_POINTS'
      );
    }
    
    const redemptionCode = generateRedemptionCode();
    
    const userReward = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { loyaltyPoints: { decrement: reward.pointsCost } },
      });
      
      await tx.reward.update({
        where: { id: reward.id },
        data: { totalRedeemed: { increment: 1 } },
      });
      
      const redeemed = await tx.userReward.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          redemptionCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: { reward: true },
      });
      
      return redeemed;
    });
    
    res.status(201).json({
      message: 'Reward redeemed successfully',
      userReward: {
        id: userReward.id,
        redemptionCode: userReward.redemptionCode,
        redeemedAt: userReward.redeemedAt.toISOString(),
        expiresAt: userReward.expiresAt.toISOString(),
        reward: formatReward(userReward.reward),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rewards/user/my
 */
router.get('/user/my', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { used } = req.query;
    
    const where: Record<string, unknown> = {
      userId: req.user!.userId,
    };
    
    if (used === 'true') {
      where.usedAt = { not: null };
    } else if (used === 'false') {
      where.usedAt = null;
      where.expiresAt = { gte: new Date() };
    }
    
    const userRewards = await prisma.userReward.findMany({
      where,
      include: { reward: true },
      orderBy: { redeemedAt: 'desc' },
    });
    
    res.json({
      rewards: userRewards.map(ur => ({
        id: ur.id,
        redemptionCode: ur.redemptionCode,
        redeemedAt: ur.redeemedAt.toISOString(),
        expiresAt: ur.expiresAt.toISOString(),
        usedAt: ur.usedAt?.toISOString(),
        isExpired: ur.expiresAt < new Date(),
        isUsed: !!ur.usedAt,
        reward: formatReward(ur.reward),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/rewards/user/my/:id/use
 */
router.put('/user/my/:id/use', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const userReward = await prisma.userReward.findFirst({
      where: { id, userId: req.user!.userId },
    });
    
    if (!userReward) {
      throw createError('Reward not found', 404);
    }
    
    if (userReward.usedAt) {
      throw createError('Reward has already been used', 400);
    }
    
    if (userReward.expiresAt < new Date()) {
      throw createError('Reward has expired', 400);
    }
    
    const updated = await prisma.userReward.update({
      where: { id },
      data: { usedAt: new Date() },
      include: { reward: true },
    });
    
    res.json({
      message: 'Reward marked as used',
      userReward: {
        id: updated.id,
        usedAt: updated.usedAt?.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatReward(reward: {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  minTier: string;
  validFrom: Date | null;
  validUntil: Date | null;
  maxRedemptions: number | null;
  totalRedeemed: number;
}) {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    pointsCost: reward.pointsCost,
    category: reward.category,
    minTier: reward.minTier,
    validFrom: reward.validFrom?.toISOString(),
    validUntil: reward.validUntil?.toISOString(),
    limited: !!reward.maxRedemptions,
    remaining: reward.maxRedemptions ? reward.maxRedemptions - reward.totalRedeemed : null,
  };
}

export default router;
