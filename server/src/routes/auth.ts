import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  codeVerifier: z.string().min(1).optional(),
  redirectUri: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
}).refine((data) => data.idToken || data.code, {
  message: 'Either idToken or code is required',
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

/**
 * POST /api/auth/forgot-password
 * Generate a reset token (dev: log to console)
 */
router.post('/forgot-password', async (req, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      console.log('[Auth] Password reset requested', {
        email,
        tokenPrefix: rawToken.slice(0, 8),
        resetToken: rawToken,
      });
    }

    res.json({ message: 'If an account exists, we will email a reset link.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using a token
 */
router.post('/reset-password', async (req, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * POST /api/auth/google
 * Login/register with Google ID token or auth code + PKCE
 */
router.post('/google', async (req, res: Response, next: NextFunction) => {
  try {
    const { idToken, code, codeVerifier, redirectUri, clientId } = googleLoginSchema.parse(req.body);

    let tokenToVerify = idToken;

    if (!tokenToVerify && code) {
      const exchangeClientId = clientId ?? GOOGLE_CLIENT_ID;
      if (!exchangeClientId) {
        throw createError('Google client ID not configured', 500, 'GOOGLE_CLIENT_ID_MISSING');
      }

      console.log('[GoogleAuth] Exchange code', {
        codePrefix: code.slice(0, 8),
        redirectUri,
      });

      const body = new URLSearchParams({
        code,
        client_id: exchangeClientId,
        code_verifier: codeVerifier ?? '',
        redirect_uri: redirectUri ?? '',
        grant_type: 'authorization_code',
      });

      const shouldSendSecret = GOOGLE_CLIENT_SECRET && (!clientId || clientId === GOOGLE_CLIENT_ID);
      if (shouldSendSecret) {
        body.append('client_secret', GOOGLE_CLIENT_SECRET);
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const tokenJson: any = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error('[GoogleAuth] token exchange failed', tokenJson);
        throw createError('Google token exchange failed', 400, 'GOOGLE_TOKEN_EXCHANGE_FAILED');
      }

      tokenToVerify = tokenJson.id_token;
    }

    if (!tokenToVerify) {
      throw createError('ID token missing', 400, 'MISSING_ID_TOKEN');
    }

    // Verify/parse the Google ID token using tokeninfo (dev-friendly)
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`
    );
    const tokenInfo: any = await tokenInfoRes.json();
    if (!tokenInfoRes.ok) {
      console.error('[GoogleAuth] tokeninfo failed', {
        status: tokenInfoRes.status,
        body: tokenInfo,
      });
      throw createError('Google token verification failed', 400, 'GOOGLE_TOKENINFO_FAILED');
    }

    const payload = {
      email: tokenInfo.email,
      given_name: tokenInfo.given_name || tokenInfo.name?.split(' ')[0],
      family_name: tokenInfo.family_name || tokenInfo.name?.split(' ').slice(1).join(' '),
      sub: tokenInfo.sub,
    };

    if (!payload.email) {
      throw createError('Email not found in token', 400, 'MISSING_EMAIL');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      // Create new user with Google info
      // Use a random password since they're using Google auth
      const randomPassword = Math.random().toString(36).slice(-16);
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email: payload.email,
          passwordHash,
          firstName: payload.given_name || 'Google',
          lastName: payload.family_name || 'User',
          loyaltyPoints: 100, // Welcome bonus
          lifetimePoints: 100,
          preferences: {
            create: {},
          },
        },
      });

      console.log(`[GoogleAuth] Created new user: ${payload.email}`);
    } else {
      console.log(`[GoogleAuth] Existing user logged in: ${payload.email}`);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Google login successful',
      user: formatUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
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
