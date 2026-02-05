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

const googleLoginSchema = z.object({
  idToken: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  codeVerifier: z.string().min(1).optional(),
  redirectUri: z.string().min(1).optional(),
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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * POST /api/auth/google
 * Login/register with Google ID token or auth code + PKCE
 */
router.post('/google', async (req, res: Response, next: NextFunction) => {
  try {
    const { idToken, code, codeVerifier, redirectUri } = googleLoginSchema.parse(req.body);

    let tokenToVerify = idToken;

    if (!tokenToVerify && code) {
      if (!GOOGLE_CLIENT_ID) {
        throw createError('Google client ID not configured', 500, 'GOOGLE_CLIENT_ID_MISSING');
      }

      const body = new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        code_verifier: codeVerifier ?? '',
        redirect_uri: redirectUri ?? '',
        grant_type: 'authorization_code',
      });

      if (GOOGLE_CLIENT_SECRET) {
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

    // Decode the Google ID token to get user info
    // NOTE: In production, use google-auth-library to verify the token!
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();

    // For development, decode the JWT payload directly
    // WARNING: This does NOT verify the token signature!
    let payload: { email?: string; given_name?: string; family_name?: string; sub?: string };
    try {
      const parts = tokenToVerify.split('.');
      if (parts.length !== 3) {
        throw createError('Invalid ID token format', 400, 'INVALID_TOKEN');
      }
      payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch (e) {
      throw createError('Could not decode ID token', 400, 'INVALID_TOKEN');
    }

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
