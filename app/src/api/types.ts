/**
 * API Request/Response Types
 */

import { User } from '../types';

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthday?: string;
}

// Orders
export interface CreateOrderRequest {
  locationId: string;
  items: {
    menuItemId: string;
    quantity: number;
    modifiers: { groupId: string; modifierId: string }[];
    specialInstructions?: string;
  }[];
  orderType: 'pickup' | 'dine-in' | 'delivery';
  scheduledTime?: string;
  tip?: number;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  estimatedTime: string;
}

// Rewards
export interface RedeemRewardRequest {
  rewardId: string;
}

export interface RedeemRewardResponse {
  userRewardId: string;
  code: string;
  expiresAt: string;
}

// Profile Updates
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
}

// Generic API Error
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
