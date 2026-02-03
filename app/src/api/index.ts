export { apiClient, ApiClient } from './client';
export * from './types';

// Re-export all endpoints for convenient imports
import * as authApi from './endpoints/auth';
import * as locationsApi from './endpoints/locations';
import * as menuApi from './endpoints/menu';
import * as ordersApi from './endpoints/orders';
import * as rewardsApi from './endpoints/rewards';

export {
  authApi,
  locationsApi,
  menuApi,
  ordersApi,
  rewardsApi,
};

// Also export individual functions for direct import
export {
  getCategories,
  getMenuItems,
  getMenuItemsByCategory,
  getMenuItem,
  getPopularItems,
  getNewItems,
  searchMenuItems,
  getMenuForLocation,
} from './endpoints/menu';

export {
  getOrders,
  getOrder,
  createOrder,
  getRecentOrders,
  getActiveOrders,
  cancelOrder,
  reorder,
  trackOrder,
} from './endpoints/orders';

export {
  getLocations,
  getLocation,
  getNearbyLocations,
  searchLocations,
  getLocationsByState,
  isLocationOpen,
} from './endpoints/locations';

export {
  getRewards,
  getReward,
  getRewardsByCategory,
  getUserRewards,
  redeemReward,
  useReward,
  getLoyaltyStatus,
  getTierInfo,
  getAllTierInfo,
  getAffordableRewards,
} from './endpoints/rewards';

export {
  login,
  register,
  getCurrentUser,
  logout,
  requestPasswordReset,
} from './endpoints/auth';
