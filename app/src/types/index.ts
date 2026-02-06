/**
 * Big Boy App - Shared Types
 */

// ============ USER & AUTH ============

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface LoyaltyStatus {
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  pointsToNextTier?: number;
  memberSince: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthday?: string;
  loyaltyStatus: LoyaltyStatus;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'gift_card' | 'apple_pay' | 'google_pay';
  lastFour: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialAmount: number;
  isActive: boolean;
  expiresAt?: string;
}

// ============ LOCATIONS ============

export interface LocationHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface LocationAmenities {
  dineIn: boolean;
  takeout: boolean;
  driveThru: boolean;
  wifi: boolean;
  playground: boolean;
  accessible: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  county?: string;
  status?: 'open' | 'coming_soon' | 'tbd';
  latitude?: number;
  longitude?: number;
  hours?: LocationHours;
  amenities?: LocationAmenities;
  distance?: number;
  isOpen?: boolean;
}

// ============ MENU ============

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  itemCount?: number;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  priceAdjustment?: number; // Alias for price, used in some contexts
  calories?: number;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  imageUrl?: string;
  calories?: number;
  prepTime?: number;
  isPopular?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  modifierGroups?: ModifierGroup[];
}

// ============ CART ============

export interface CartItemModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  modifierName: string;
  name?: string; // Alias for modifierName
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: CartItemModifier[];
  specialInstructions?: string;
  image?: string;
  ingredientOptions?: string[];
  selectedIngredients?: string[];
  addOnOptions?: { name: string; priceAdjustment: number }[];
  selectedAddOns?: string[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

// ============ ORDERS ============

export type OrderType = 'pickup' | 'dine-in' | 'delivery';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface OrderItemModifier {
  id: string;
  groupId: string;
  groupName: string;
  modifierId: string;
  modifierName: string;
  name?: string; // Alias for modifierName
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  price?: number; // Alias for unitPrice
  modifiers: OrderItemModifier[];
  specialInstructions?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  locationId: string;
  location?: Location;
  locationName?: string; // Convenience property
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  customer?: {
    name: string;
    phone: string;
    email?: string;
  };
  payment?: {
    method: string;
    status: PaymentStatus;
  };
  items: OrderItem[];
  scheduledFor?: string;
  estimatedReady?: string;
  estimatedTime?: string; // Alias for estimatedReady
  completedAt?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============ REWARDS ============

export type RewardCategory = 'food' | 'drink' | 'dessert' | 'combo' | 'merchandise';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  minTier: LoyaltyTier;
  imageUrl?: string;
  validFrom?: string;
  validUntil?: string;
  isAvailable: boolean;
  limited?: boolean;
  remaining?: number | null;
}

export interface UserReward {
  id: string;
  reward: Reward;
  code: string;
  redeemedAt?: string;
  expiresAt: string;
  usedAt?: string;
  isUsed: boolean;
  isExpired?: boolean;
}

// ============ API ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
