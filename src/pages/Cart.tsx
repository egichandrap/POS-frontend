import { useCartStore } from '../stores/cart';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api-client';
import { Plus, Minus, Trash2, ArrowLeft, CreditCard, Wallet, QrCode, Banknote, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

type PaymentMethod = 'CASH' | 'CARD' | 'QRIS' | 'E_WALLET';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'CASH', label: 'Tunai', icon: Banknote },
  { value: 'CARD', label: 'Kartu', icon: CreditCard },
  { value: 'QRIS', label: 'QRIS', icon: QrCode },
  { value: 'E_WALLET', label: 'E-Wallet', icon: Wallet },
];

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, tableId, customerName, setCustomerInfo, clearCart } = useCartStore();
  
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'info' | 'checkout'>('info');

  const calculateTotal = () => subtotal() * 1.11;
  const totalAmount = calculateTotal();
  const paymentValue = parseInt(paymentAmount) || 0;
  const changeAmount = paymentValue - totalAmount;

  const handleCreateOrder = async () => {
    if (!tableId) {
      toast.error('Meja tidak ditemukan');
      return;
    }

    if (!name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }

    setIsProcessing(true);
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

      // Move to checkout step
      setStep('checkout');
      toast.success('Order created! Proceed to payment.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!tableId) return;

    if (paymentMethod === 'CASH' && changeAmount < 0) {
      toast.error('Insufficient payment amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Find the existing order for this table/customer
      // Since we already created the order, we need to get it
      const orders = await apiService.getOrders({ table_id: tableId, limit: 10 });
      const currentOrder = orders.find(o => o.customer_name === name && o.status === 'PENDING');
      
      if (!currentOrder) {
        // Create new order if not exists
        const order = await apiService.createGuestOrder({
          table_id: tableId,
          customer_name: name,
          customer_phone: phone,
        });

        for (const item of items) {
          await apiService.addOrderItem(order.id, {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes,
          });
        }

        await apiService.checkoutOrder(order.id, {
          payment_method: paymentMethod,
          payment_amount: paymentValue,
          customer_name: name,
        });
      } else {
        await apiService.checkoutOrder(currentOrder.id, {
          payment_method: paymentMethod,
          payment_amount: paymentValue,
          customer_name: name,
        });
      }

      toast.success('Payment successful! Thank you!');
      clearCart();
      
      // Navigate to order tracking
      navigate(`/order/${currentOrder?.id || tableId}/tracking`);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
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

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <button onClick={() => setStep('info')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <h1 className="text-xl font-bold">Pembayaran</h1>
            </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Order Summary */}
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rp {subtotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pajak (11%)</span>
                <span>Rp {(subtotal() * 0.11).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary-600">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card mb-6">
            <h2 className="font-semibold mb-4">Metode Pembayaran</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`w-6 h-6 ${paymentMethod === method.value ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === method.value ? 'text-primary-600' : 'text-gray-600'}`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Payment */}
          {paymentMethod === 'CASH' && (
            <div className="card mb-6">
              <h2 className="font-semibold mb-4">Jumlah Pembayaran</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input text-2xl text-center font-bold"
                  placeholder="0"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount(amount.toString())}
                      className="btn btn-outline py-2"
                    >
                      Rp {amount.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount((parseInt(paymentAmount) || 0 + amount).toString())}
                      className="btn btn-outline py-2"
                    >
                      +{amount.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Change Display */}
          {paymentMethod === 'CASH' && changeAmount >= 0 && (
            <div className="card mb-6 bg-green-50 border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Kembalian</span>
                <span className="text-2xl font-bold text-green-600">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing || (paymentMethod === 'CASH' && changeAmount < 0)}
            className="btn btn-primary w-full py-4 text-lg"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Bayar Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            )}
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
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <button
            onClick={handleCreateOrder}
            disabled={isProcessing}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {isProcessing ? 'Processing...' : 'Buat Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
