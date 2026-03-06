import { apiClient } from '../client';
import { MenuCategory, MenuItem } from '../../types';

/**
 * Admin API Endpoints
 * These endpoints require admin authentication.
 */

// Types
export interface AdminMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  calories: number | null;
  prepTime: number | null;
  isPopular: boolean;
  isNew: boolean;
  isAvailable: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string | null;
  calories?: number | null;
  prepTime?: number | null;
  isPopular?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {}

export interface AdminMenuItemsResponse {
  items: AdminMenuItem[];
  total: number;
  hasMore: boolean;
}

export interface AdminCategoriesResponse {
  categories: AdminCategory[];
}

/**
 * Get all menu items for admin (includes unavailable)
 */
export const getAdminMenuItems = async (params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminMenuItemsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set('category', params.category);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.offset) queryParams.set('offset', String(params.offset));

  const queryString = queryParams.toString();
  const url = `/admin/menu/items${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<AdminMenuItemsResponse>(url);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error ?? 'Failed to fetch menu items');
};

/**
 * Get all categories for admin
 */
export const getAdminCategories = async (): Promise<AdminCategory[]> => {
  const response = await apiClient.get<AdminCategoriesResponse>('/admin/menu/categories');
  if (response.success && response.data?.categories) {
    return response.data.categories;
  }
  throw new Error(response.error ?? 'Failed to fetch categories');
};

/**
 * Create a new menu item
 */
export const createMenuItem = async (data: CreateMenuItemRequest): Promise<AdminMenuItem> => {
  const response = await apiClient.post<{ message: string; item: AdminMenuItem }>(
    '/admin/menu/items',
    data
  );
  if (response.success && response.data?.item) {
    return response.data.item;
  }
  throw new Error(response.error ?? 'Failed to create menu item');
};

/**
 * Update a menu item
 */
export const updateMenuItem = async (
  id: string,
  data: UpdateMenuItemRequest
): Promise<AdminMenuItem> => {
  const response = await apiClient.patch<{ message: string; item: AdminMenuItem }>(
    `/admin/menu/items/${id}`,
    data
  );
  if (response.success && response.data?.item) {
    return response.data.item;
  }
  throw new Error(response.error ?? 'Failed to update menu item');
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (id: string): Promise<void> => {
  const response = await apiClient.delete<{ message: string }>(`/admin/menu/items/${id}`);
  if (!response.success) {
    throw new Error(response.error ?? 'Failed to delete menu item');
  }
};

/**
 * Toggle menu item availability
 */
export const toggleMenuItemAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<{ id: string; name: string; isAvailable: boolean }> => {
  const response = await apiClient.patch<{
    message: string;
    item: { id: string; name: string; isAvailable: boolean };
  }>(`/admin/menu/items/${id}/availability`, { isAvailable });
  
  if (response.success && response.data?.item) {
    return response.data.item;
  }
  throw new Error(response.error ?? 'Failed to toggle availability');
};

// --- Location Override API ---

export interface LocationAvailability {
  id: string;
  name: string;
  city: string;
  state: string;
  isAvailable: boolean;
}

/**
 * Get location availability for a menu item
 */
export const getItemLocationOverrides = async (
  itemId: string
): Promise<LocationAvailability[]> => {
  const response = await apiClient.get<{ locations: LocationAvailability[] }>(
    `/admin/menu/items/${itemId}/locations`
  );
  if (response.success && response.data?.locations) {
    return response.data.locations;
  }
  throw new Error(response.error ?? 'Failed to fetch location overrides');
};

/**
 * Set location availability for a menu item
 */
export const setItemLocationOverrides = async (
  itemId: string,
  overrides: { locationId: string; isAvailable: boolean }[]
): Promise<void> => {
  const response = await apiClient.put<{ message: string }>(
    `/admin/menu/items/${itemId}/locations`,
    { overrides }
  );
  if (!response.success) {
    throw new Error(response.error ?? 'Failed to update location availability');
  }
};

// ============================================================
// PROMO CODE TYPES & API
// ============================================================

export interface PromoCodeData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  template: string;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  applicableItemId: string | null;
  applicableItem: { id: string; name: string } | null;
  applicableCategoryId: string | null;
  applicableCategory: { id: string; name: string } | null;
  maxTotalUses: number | null;
  maxUsesPerUser: number;
  totalUsed: number;
  timesUsed: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  locations: { id: string; name: string }[];
  createdAt: string;
}

export interface CreatePromoCodeRequest {
  code: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  template?: string;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  applicableItemId?: string | null;
  applicableCategoryId?: string | null;
  maxTotalUses?: number | null;
  maxUsesPerUser?: number;
  startsAt?: string;
  expiresAt?: string | null;
  isActive?: boolean;
  locationIds?: string[];
}

export const getPromoCodes = async (params?: { search?: string; active?: string }): Promise<{ promoCodes: PromoCodeData[]; total: number }> => {
  const qp = new URLSearchParams();
  if (params?.search) qp.set('search', params.search);
  if (params?.active) qp.set('active', params.active);
  const qs = qp.toString();
  const response = await apiClient.get<{ promoCodes: PromoCodeData[]; total: number }>(`/admin/promo-codes${qs ? `?${qs}` : ''}`);
  if (response.success && response.data) return response.data;
  throw new Error(response.error ?? 'Failed to fetch promo codes');
};

export const createPromoCode = async (data: CreatePromoCodeRequest): Promise<PromoCodeData> => {
  const response = await apiClient.post<{ promoCode: PromoCodeData }>('/admin/promo-codes', data);
  if (response.success && response.data?.promoCode) return response.data.promoCode;
  throw new Error(response.error ?? 'Failed to create promo code');
};

export const updatePromoCode = async (id: string, data: Partial<CreatePromoCodeRequest>): Promise<PromoCodeData> => {
  const response = await apiClient.patch<{ promoCode: PromoCodeData }>(`/admin/promo-codes/${id}`, data);
  if (response.success && response.data?.promoCode) return response.data.promoCode;
  throw new Error(response.error ?? 'Failed to update promo code');
};

export const deletePromoCode = async (id: string): Promise<void> => {
  const response = await apiClient.delete<{ message: string }>(`/admin/promo-codes/${id}`);
  if (!response.success) throw new Error(response.error ?? 'Failed to delete promo code');
};

export const togglePromoCode = async (id: string): Promise<void> => {
  const response = await apiClient.patch<{ message: string }>(`/admin/promo-codes/${id}/toggle`, {});
  if (!response.success) throw new Error(response.error ?? 'Failed to toggle promo code');
};

// ============================================================
// DISCOUNT TYPES & API
// ============================================================

export interface DiscountData {
  id: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  template: string;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  applicableItemId: string | null;
  applicableItem: { id: string; name: string } | null;
  applicableCategoryId: string | null;
  applicableCategory: { id: string; name: string } | null;
  startsAt: string;
  expiresAt: string | null;
  activeDays: string | null;
  activeTimeStart: string | null;
  activeTimeEnd: string | null;
  stackable: boolean;
  priority: number;
  isActive: boolean;
  timesUsed: number;
  locations: { id: string; name: string }[];
  createdAt: string;
}

export interface CreateDiscountRequest {
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  template?: string;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  applicableItemId?: string | null;
  applicableCategoryId?: string | null;
  startsAt?: string;
  expiresAt?: string | null;
  activeDays?: string | null;
  activeTimeStart?: string | null;
  activeTimeEnd?: string | null;
  stackable?: boolean;
  priority?: number;
  isActive?: boolean;
  locationIds?: string[];
}

export const getDiscounts = async (params?: { active?: string }): Promise<{ discounts: DiscountData[]; total: number }> => {
  const qp = new URLSearchParams();
  if (params?.active) qp.set('active', params.active);
  const qs = qp.toString();
  const response = await apiClient.get<{ discounts: DiscountData[]; total: number }>(`/admin/discounts${qs ? `?${qs}` : ''}`);
  if (response.success && response.data) return response.data;
  throw new Error(response.error ?? 'Failed to fetch discounts');
};

export const createDiscount = async (data: CreateDiscountRequest): Promise<DiscountData> => {
  const response = await apiClient.post<{ discount: DiscountData }>('/admin/discounts', data);
  if (response.success && response.data?.discount) return response.data.discount;
  throw new Error(response.error ?? 'Failed to create discount');
};

export const updateDiscount = async (id: string, data: Partial<CreateDiscountRequest>): Promise<DiscountData> => {
  const response = await apiClient.patch<{ discount: DiscountData }>(`/admin/discounts/${id}`, data);
  if (response.success && response.data?.discount) return response.data.discount;
  throw new Error(response.error ?? 'Failed to update discount');
};

export const deleteDiscount = async (id: string): Promise<void> => {
  const response = await apiClient.delete<{ message: string }>(`/admin/discounts/${id}`);
  if (!response.success) throw new Error(response.error ?? 'Failed to delete discount');
};

export const toggleDiscount = async (id: string): Promise<void> => {
  const response = await apiClient.patch<{ message: string }>(`/admin/discounts/${id}/toggle`, {});
  if (!response.success) throw new Error(response.error ?? 'Failed to toggle discount');
};

// ============================================================
// REWARDS ADMIN API
// ============================================================

export interface AdminReward {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  pointsCost: number;
  category: string;
  minTier: string;
  validFrom: string | null;
  validUntil: string | null;
  maxRedemptions: number | null;
  totalRedeemed: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRewardRequest {
  name: string;
  description?: string;
  imageUrl?: string | null;
  pointsCost: number;
  category: string;
  minTier?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  maxRedemptions?: number | null;
  isActive?: boolean;
}

export const getAdminRewards = async (params?: { active?: string; category?: string }): Promise<AdminReward[]> => {
  const qp = new URLSearchParams();
  if (params?.active) qp.set('active', params.active);
  if (params?.category) qp.set('category', params.category);
  const qs = qp.toString();
  const response = await apiClient.get<{ rewards: AdminReward[] }>(`/admin/rewards${qs ? `?${qs}` : ''}`);
  if (response.success && response.data?.rewards) return response.data.rewards;
  throw new Error(response.error ?? 'Failed to fetch rewards');
};

export const createReward = async (data: CreateRewardRequest): Promise<AdminReward> => {
  const response = await apiClient.post<{ reward: AdminReward }>('/admin/rewards', data);
  if (response.success && response.data?.reward) return response.data.reward;
  throw new Error(response.error ?? 'Failed to create reward');
};

export const updateReward = async (id: string, data: Partial<CreateRewardRequest>): Promise<AdminReward> => {
  const response = await apiClient.patch<{ reward: AdminReward }>(`/admin/rewards/${id}`, data);
  if (response.success && response.data?.reward) return response.data.reward;
  throw new Error(response.error ?? 'Failed to update reward');
};

export const deleteReward = async (id: string): Promise<void> => {
  const response = await apiClient.delete<{ message: string }>(`/admin/rewards/${id}`);
  if (!response.success) throw new Error(response.error ?? 'Failed to delete reward');
};

export const toggleReward = async (id: string): Promise<void> => {
  const response = await apiClient.patch<{ message: string }>(`/admin/rewards/${id}/toggle`, {});
  if (!response.success) throw new Error(response.error ?? 'Failed to toggle reward');
};

// ============================================================
// USER ROLE MANAGEMENT
// ============================================================

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  lifetimePoints: number;
  orderCount: number;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  hasMore: boolean;
}

export const getUsers = async (params?: { search?: string; limit?: number; offset?: number }): Promise<UsersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.offset) queryParams.set('offset', String(params.offset));
  const qs = queryParams.toString();
  const response = await apiClient.get<UsersResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
  if (!response.success || !response.data) throw new Error(response.error ?? 'Failed to load users');
  return response.data;
};

export const updateUserRole = async (userId: string, role: 'USER' | 'ADMIN'): Promise<void> => {
  const response = await apiClient.patch<{ message: string }>(`/admin/users/${userId}/role`, { role });
  if (!response.success) throw new Error(response.error ?? 'Failed to update user role');
};

// ============================================================
// PROMO TEMPLATES
// ============================================================

export interface PromoTemplate {
  id: string;
  name: string;
  description: string;
  discountType: string;
  icon: string;
  fields: string[];
  defaults: Record<string, unknown>;
}

export const getPromoTemplates = async (): Promise<PromoTemplate[]> => {
  const response = await apiClient.get<{ templates: PromoTemplate[] }>('/admin/promo-templates');
  if (response.success && response.data?.templates) return response.data.templates;
  throw new Error(response.error ?? 'Failed to fetch templates');
};

// ============================================================
// PROMO CODE VALIDATION (public, for checkout)
// ============================================================

export interface PromoValidation {
  valid: boolean;
  promoCode: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    template: string;
    applicableItem: { id: string; name: string } | null;
    applicableCategory: { id: string; name: string } | null;
    minOrderAmount: number | null;
    maxDiscount: number | null;
  };
  discountPreview: number;
}

export const validatePromoCode = async (code: string, locationId?: string, subtotal?: number): Promise<PromoValidation> => {
  const response = await apiClient.post<PromoValidation>('/orders/validate-promo', {
    code,
    locationId,
    subtotal,
  });
  if (response.success && response.data) return response.data;
  throw new Error(response.error ?? 'Invalid promo code');
};
