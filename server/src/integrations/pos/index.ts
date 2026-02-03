/**
 * Oracle Simphony POS Stub Interface
 * 
 * This is a stub implementation for the Oracle Simphony POS integration.
 * Replace with actual implementation when connecting to real POS system.
 */

export interface POSOrder {
  checkNumber: string;
  tableNumber?: string;
  items: POSOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  employeeId?: string;
}

export interface POSOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: POSModifier[];
  specialInstructions?: string;
}

export interface POSModifier {
  id: string;
  name: string;
  price: number;
}

export interface POSResponse {
  success: boolean;
  checkNumber?: string;
  error?: string;
}

/**
 * POS Client Stub
 */
export class POSClient {
  private apiUrl: string;
  private apiKey: string;
  
  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || process.env.POS_API_URL || 'http://localhost:8080/pos';
    this.apiKey = apiKey || process.env.POS_API_KEY || 'stub-api-key';
  }
  
  /**
   * Send order to POS system
   * STUB: Always returns success
   */
  async sendOrder(locationId: string, order: POSOrder): Promise<POSResponse> {
    console.log(`[POS STUB] Sending order to location ${locationId}:`, order);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // STUB: Always return success
    return {
      success: true,
      checkNumber: order.checkNumber,
    };
  }
  
  /**
   * Get order status from POS
   * STUB: Always returns random status
   */
  async getOrderStatus(locationId: string, checkNumber: string): Promise<{
    status: 'pending' | 'preparing' | 'ready' | 'completed';
    estimatedMinutes?: number;
  }> {
    console.log(`[POS STUB] Getting status for check ${checkNumber} at location ${locationId}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // STUB: Return random status
    const statuses = ['pending', 'preparing', 'ready', 'completed'] as const;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      estimatedMinutes: randomStatus === 'preparing' ? Math.floor(Math.random() * 10) + 5 : undefined,
    };
  }
  
  /**
   * Cancel order in POS
   * STUB: Always returns success
   */
  async cancelOrder(locationId: string, checkNumber: string): Promise<POSResponse> {
    console.log(`[POS STUB] Cancelling order ${checkNumber} at location ${locationId}`);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      success: true,
      checkNumber,
    };
  }
  
  /**
   * Sync menu from POS
   * STUB: Returns empty array
   */
  async syncMenu(locationId: string): Promise<POSOrderItem[]> {
    console.log(`[POS STUB] Syncing menu for location ${locationId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STUB: Return empty - use database menu instead
    return [];
  }
  
  /**
   * Check POS system health
   * STUB: Always healthy
   */
  async healthCheck(locationId: string): Promise<boolean> {
    console.log(`[POS STUB] Health check for location ${locationId}`);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return true;
  }
}

// Export singleton instance
export const posClient = new POSClient();

export default posClient;
