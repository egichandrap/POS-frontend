import { useCartStore } from '../stores/cart';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api-client';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, tableId, customerName, setCustomerInfo } = useCartStore();
  
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState('');

  const handleCreateOrder = async () => {
    if (!tableId) {
      toast.error('Meja tidak ditemukan');
      return;
    }

    if (!name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }

    try {
      setCustomerInfo(name, phone);
      
      const order = await apiService.createGuestOrder({
        table_id: tableId,
        customer_name: name,
        customer_phone: phone,
      });

      // Add all items to order
      for (const item of items) {
        await apiService.addOrderItem(order.id, {
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes,
        });
      }

      toast.success('Order berhasil dibuat!');
      navigate(`/order/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat order');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Keranjang kosong</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <h1 className="text-xl font-bold">Keranjang</h1>
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Customer Info */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Informasi Pemesan</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nama *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Masukkan nama Anda"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">No. Telepon (opsional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Item Pesanan</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-4 pb-4 border-b">
                <div className="flex-1">
                  <h3 className="font-medium">{item.product_name}</h3>
                  <p className="text-sm text-gray-600">Rp {item.unit_price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-1 rounded bg-red-200 hover:bg-red-300 text-red-600 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right font-semibold">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rp {subtotal().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pajak (11%)</span>
              <span>Rp {(subtotal() * 0.11).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary-600">
                Rp {(subtotal() * 1.11).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <button
            onClick={handleCreateOrder}
            className="btn btn-primary w-full py-3 text-lg"
          >
            Buat Order
          </button>
        </div>
      </div>
    </div>
  );
}
