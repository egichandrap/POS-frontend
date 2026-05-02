import { API_BASE_URL, type ApiResponse, ApiError } from './api';
import type {
  Table,
  CreateTableRequest,
  UpdateTableRequest,
  GuestOrder,
  CreateGuestOrderRequest,
  AddOrderItemRequest,
  GuestCheckoutRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  LoginRequest,
  LoginResponse,
  User,
  SalesSummary,
} from '../types';

class ApiService {
  private token: string | null = null;
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = API_BASE_URL, timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  loadToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  /**
   * Generic fetch helper with error handling, timeout, and token injection
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Setup timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = data as any;
        throw new ApiError(
          response.status,
          errorData?.error?.code || 'UNKNOWN_ERROR',
          errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Extract data from API response wrapper
      if (data && typeof data === 'object' && 'success' in data) {
        const apiResponse = data as ApiResponse<T>;
        if (!apiResponse.success) {
          throw new ApiError(
            response.status,
            'API_ERROR',
            apiResponse.message || 'Request failed'
          );
        }
        return apiResponse.data;
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'TIMEOUT_ERROR', 'Request timeout');
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'NETWORK_ERROR', 'Network error. Check your connection.');
      }

      // Re-throw if already an ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown errors
      throw new ApiError(
        0,
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  // ============ AUTH ============

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Auto-save token
    this.setToken(response.access_token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearToken();
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // ============ ADMIN USERS ============

  async getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.set('role', params.role);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const queryString = queryParams.toString();
    return this.request<User[]>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  // ============ TABLES (Admin) ============

  async getTables(params?: {
    location?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Table[]> {
    const queryParams = new URLSearchParams();
    if (params?.location) queryParams.set('location', params.location);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const queryString = queryParams.toString();
    return this.request<Table[]>(`/tables${queryString ? `?${queryString}` : ''}`);
  }

  async getAvailableTables(location?: string): Promise<Table[]> {
    const params = location ? `?location=${encodeURIComponent(location)}` : '';
    return this.request<Table[]>(`/tables/available${params}`);
  }

  async getTable(id: string): Promise<Table> {
    return this.request<Table>(`/tables/${id}`);
  }

  async createTable(request: CreateTableRequest): Promise<Table> {
    return this.request<Table>('/tables', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateTable(id: string, request: UpdateTableRequest): Promise<Table> {
    return this.request<Table>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteTable(id: string): Promise<void> {
    return this.request<void>(`/tables/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTableStatus(id: string, status: Table['status']): Promise<Table> {
    return this.request<Table>(`/tables/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async generateQRCode(id: string): Promise<string> {
    const response = await this.request<{ qr_code: string }>(`/tables/${id}/qr`, {
      method: 'POST',
    });
    return response.qr_code;
  }

  // ============ GUEST ORDERS (Public) ============

  async createGuestOrder(request: CreateGuestOrderRequest): Promise<GuestOrder> {
    return this.request<GuestOrder>('/guest/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getGuestOrder(id: string): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${id}`);
  }

  async addOrderItem(orderId: string, request: AddOrderItemRequest): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateItemQuantity(
    orderId: string,
    productId: string,
    quantity: number
  ): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${orderId}/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeItem(orderId: string, productId: string): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${orderId}/items/${productId}`, {
      method: 'DELETE',
    });
  }

  async checkoutOrder(orderId: string, request: GuestCheckoutRequest): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async cancelOrder(orderId: string): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/guest/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  // ============ ORDER MANAGEMENT (Staff) ============

  async getOrders(params?: {
    status?: string;
    table_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<GuestOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.table_id) queryParams.set('table_id', params.table_id);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const queryString = queryParams.toString();
    return this.request<GuestOrder[]>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingOrders(): Promise<GuestOrder[]> {
    return this.request<GuestOrder[]>('/orders/pending');
  }

  async getActiveOrders(): Promise<GuestOrder[]> {
    return this.request<GuestOrder[]>('/orders/active');
  }

  async getOrder(id: string): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/orders/${id}`);
  }

  async updateOrderStatus(
    id: string,
    status: GuestOrder['status']
  ): Promise<GuestOrder> {
    return this.request<GuestOrder>(`/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async getOrdersByTable(tableId: string): Promise<GuestOrder[]> {
    return this.request<GuestOrder[]>(`/orders/table/${tableId}`);
  }

  // ============ INVENTORY ============

  async getProducts(params?: {
    sku?: string;
    name?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.sku) queryParams.set('sku', params.sku);
    if (params?.name) queryParams.set('name', params.name);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const queryString = queryParams.toString();
    return this.request<Product[]>(`/inventory${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/inventory/${id}`);
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    return this.request<Product>('/inventory', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
    return this.request<Product>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.request<Product>(`/inventory/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async adjustStock(id: string, amount: number): Promise<Product> {
    return this.request<Product>(`/inventory/${id}/stock/adjust`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // ============ REPORTS (Admin) ============

  async getTodaySales(): Promise<SalesSummary> {
    return this.request<SalesSummary>('/reports/sales/today');
  }
}

export const apiService = new ApiService();
