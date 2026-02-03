import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bigboy-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    options
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Authentication middleware - requires valid JWT
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw createError('No authorization header', 401, 'NO_AUTH_HEADER');
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createError('Invalid authorization format', 401, 'INVALID_AUTH_FORMAT');
    }
    
    const token = parts[1];
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401, 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication middleware - attaches user if token present
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    
    const token = parts[1];
    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch {
    // Token invalid but optional, continue without user
    next();
  }
}

/**
 * Admin authentication middleware (for local admin tools)
 */
export function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // In production, implement proper admin role checking
  // For local dev, we'll allow authenticated users
  authenticate(req, res, (error) => {
    if (error) {
      next(error);
    } else {
      // TODO: Add admin role check when roles are implemented
      // For now, any authenticated user can access admin routes locally
      next();
    }
  });
}
