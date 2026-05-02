// Table Types
export interface Table {
  id: string;
  number: number;
  location: 'INDOOR' | 'OUTDOOR' | 'VIP' | 'PATIO';
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  qr_code?: string;
  qr_generated: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTableRequest {
  number: number;
  location: 'INDOOR' | 'OUTDOOR' | 'VIP' | 'PATIO';
  capacity: number;
  description?: string;
}

export interface UpdateTableRequest {
  location?: 'INDOOR' | 'OUTDOOR' | 'VIP' | 'PATIO';
  capacity?: number;
  description?: string;
}

// Guest Order Types
export interface GuestOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface GuestOrder {
  id: string;
  order_number: string;
  table_id: string;
  table_number: number;
  customer_name: string;
  customer_phone?: string;
  items: GuestOrderItem[];
  subtotal: number;
  tax_amount: number;
  tax_percent: number;
  discount_amount: number;
  discount_percent: number;
  total_amount: number;
  payment_method: 'CASH' | 'CARD' | 'QRIS' | 'E_WALLET' | 'TRANSFER';
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  payment_amount: number;
  change_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateGuestOrderRequest {
  table_id: string;
  customer_name: string;
  customer_phone?: string;
  session_id?: string;
}

export interface AddOrderItemRequest {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface GuestCheckoutRequest {
  payment_method: 'CASH' | 'CARD' | 'QRIS' | 'E_WALLET' | 'TRANSFER';
  payment_amount?: number;
  customer_name?: string;
  notes?: string;
}

// Inventory/Product Type
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  location?: string;
  min_stock?: number;
  max_stock?: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  location?: string;
  min_stock?: number;
  max_stock?: number;
  price: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  location?: string;
  min_stock?: number;
  max_stock?: number;
}

// Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Sales Summary
export interface SalesSummary {
  total_sales: number;
  total_orders: number;
  total_items: number;
  date?: string;
}

// Transaction/Order for Sales
export interface Transaction {
  id: string;
  order_number: string;
  table_id: string;
  table_number: number;
  customer_name: string;
  customer_phone?: string;
  items: GuestOrderItem[];
  subtotal: number;
  tax_amount: number;
  tax_percent: number;
  discount_amount: number;
  discount_percent: number;
  total_amount: number;
  payment_method: 'CASH' | 'CARD' | 'QRIS' | 'E_WALLET' | 'TRANSFER';
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  payment_amount: number;
  change_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
