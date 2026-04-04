import { create } from 'zustand';
import type { GuestOrderItem, Product } from '../types';

interface CartItem extends GuestOrderItem {
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  orderId: string | null;
  tableId: string | null;
  tableNumber: number | null;
  customerName: string;
  customerPhone: string;
  addItem: (product: Product, quantity: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderId: (orderId: string) => void;
  setTableInfo: (tableId: string, tableNumber: number) => void;
  setCustomerInfo: (name: string, phone?: string) => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderId: null,
  tableId: null,
  tableNumber: null,
  customerName: '',
  customerPhone: '',

  addItem: (product, quantity, notes) => {
    const items = [...get().items];
    const existingIndex = items.findIndex((item) => item.product_id === product.id);

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      items[existingIndex].subtotal = items[existingIndex].quantity * product.price;
    } else {
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        subtotal: quantity * product.price,
        notes,
        stock: product.quantity,
      });
    }

    set({ items });
  },

  removeItem: (productId) => {
    const items = get().items.filter((item) => item.product_id !== productId);
    set({ items });
  },

  updateQuantity: (productId, quantity) => {
    const items = [...get().items];
    const index = items.findIndex((item) => item.product_id === productId);

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
        items[index].subtotal = quantity * items[index].unit_price;
      }
    }

    set({ items });
  },

  clearCart: () => {
    set({
      items: [],
      orderId: null,
      customerName: '',
      customerPhone: '',
    });
  },

  setOrderId: (orderId) => set({ orderId }),

  setTableInfo: (tableId, tableNumber) => {
    set({ tableId, tableNumber });
  },

  setCustomerInfo: (name, phone = '') => {
    set({ customerName: name, customerPhone: phone });
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
