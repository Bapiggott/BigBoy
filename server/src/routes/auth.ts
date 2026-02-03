import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existing) {
      throw createError('Email already registered', 409, 'USER_EXISTS');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Create user with 100 welcome points
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        loyaltyPoints: 100, // Welcome bonus
        lifetimePoints: 100,
        preferences: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        lifetimePoints: true,
        memberSince: true,
      },
    });
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    res.status(201).json({
      message: 'Registration successful',
      user: formatUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (!user) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!validPassword) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    res.json({
      message: 'Login successful',
      user: formatUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        preferences: true,
      },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    res.json({ user: formatUser(user) });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Update user password
 */
router.put('/password', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updatePasswordSchema.parse(req.body);
    
    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    
    if (!validPassword) {
      throw createError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash },
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticate, async (_req: AuthenticatedRequest, res: Response) => {
  // In a more complex system, we might invalidate tokens server-side
  res.json({ message: 'Logged out successfully' });
});

// Helper: Format user for response
function formatUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  loyaltyPoints: number;
  loyaltyTier: string;
  lifetimePoints: number;
  memberSince: Date;
}) {
  // Calculate points to next tier
  const tierThresholds = { BRONZE: 1000, SILVER: 5000, GOLD: Infinity };
  const nextTier = user.loyaltyTier === 'BRONZE' ? 'SILVER' : user.loyaltyTier === 'SILVER' ? 'GOLD' : null;
  const pointsToNextTier = nextTier ? tierThresholds[user.loyaltyTier as keyof typeof tierThresholds] - user.lifetimePoints : 0;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    loyaltyStatus: {
      currentPoints: user.loyaltyPoints,
      lifetimePoints: user.lifetimePoints,
      tier: user.loyaltyTier.toLowerCase(),
      pointsToNextTier: Math.max(0, pointsToNextTier),
      memberSince: user.memberSince.toISOString().split('T')[0],
    },
    createdAt: user.memberSince.toISOString(),
  };
}

export default router;
