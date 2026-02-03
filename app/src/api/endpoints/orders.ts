import { apiClient } from '../client';
import { Order } from '../../types';
import { CreateOrderRequest, CreateOrderResponse } from '../types';
import { mockOrders } from '../../data/mockOrders';

/**
 * Orders API Endpoints
 * Currently returns mock data - swap implementation when backend is ready
 */

const USE_MOCK = true;

/**
 * Get all orders for current user
 */
export const getOrders = async (): Promise<Order[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const response = await apiClient.get<{ orders: Order[] }>('/orders');
  return response.success && response.data ? response.data.orders : [];
};

/**
 * Get a single order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockOrders.find(order => order.id === orderId) ?? null;
  }

  const response = await apiClient.get<{ order: Order }>(`/orders/${orderId}`);
  return response.success ? response.data?.order ?? null : null;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: CreateOrderRequest): Promise<CreateOrderResponse | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate mock order response
    const orderNumber = `BB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const estimatedMinutes = 15 + Math.floor(Math.random() * 15);
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);

    return {
      orderId: `ord-${Date.now()}`,
      orderNumber,
      estimatedTime: estimatedTime.toISOString(),
    };
  }

  const response = await apiClient.post<{ order: CreateOrderResponse }>('/orders', orderData);
  return response.success ? response.data?.order ?? null : null;
};

/**
 * Get recent orders (last 30 days)
 */
export const getRecentOrders = async (): Promise<Order[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return mockOrders
      .filter(order => new Date(order.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const response = await apiClient.get<{ orders: Order[] }>('/orders?recent=true');
  return response.success && response.data ? response.data.orders : [];
};

/**
 * Get active orders (not completed or cancelled)
 */
export const getActiveOrders = async (): Promise<Order[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrders.filter(
      order => !['completed', 'cancelled'].includes(order.status)
    );
  }

  const response = await apiClient.get<{ orders: Order[] }>('/orders?status=active');
  return response.success && response.data ? response.data.orders : [];
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<boolean> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Find the order and check if it can be cancelled
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) return false;
    if (['completed', 'cancelled', 'ready'].includes(order.status)) return false;
    return true;
  }

  const response = await apiClient.put(`/orders/${orderId}/cancel`);
  return response.success;
};

/**
 * Reorder from a previous order
 */
export const reorder = async (orderId: string, locationId?: string): Promise<CreateOrderResponse | null> => {
  if (USE_MOCK) {
    const originalOrder = mockOrders.find(o => o.id === orderId);
    if (!originalOrder) return null;

    // Create new order from previous order items
    const orderData: CreateOrderRequest = {
      locationId: locationId || originalOrder.locationId,
      items: originalOrder.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => ({
          groupId: m.groupId,
          modifierId: m.modifierId,
        })),
        specialInstructions: item.specialInstructions,
      })),
      orderType: originalOrder.orderType,
    };

    return createOrder(orderData);
  }

  const response = await apiClient.post<{ order: CreateOrderResponse }>(`/orders/${orderId}/reorder`, {
    locationId,
  });
  return response.success ? response.data?.order ?? null : null;
};

/**
 * Track order status (polling)
 */
export const trackOrder = async (orderId: string): Promise<Order | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) return null;

    // Simulate status progression
    const statusProgression: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed',
    };

    // 30% chance to advance status on each poll
    if (Math.random() < 0.3 && statusProgression[order.status]) {
      return {
        ...order,
        status: statusProgression[order.status] as Order['status'],
        updatedAt: new Date().toISOString(),
      };
    }

    return order;
  }

  const response = await apiClient.get<{ order: Order }>(`/orders/${orderId}/track`);
  return response.success ? response.data?.order ?? null : null;
};
