import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import type { GuestOrder } from '../types';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Download,
  RefreshCw,
  Search,
  Eye,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
} from 'lucide-react';

type PaymentMethod = 'CASH' | 'CARD' | 'QRIS' | 'E_WALLET' | 'TRANSFER';

const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: any; color: string }> = {
  CASH: { label: 'Cash', icon: Banknote, color: 'bg-green-100 text-green-700' },
  CARD: { label: 'Card', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
  QRIS: { label: 'QRIS', icon: QrCode, color: 'bg-purple-100 text-purple-700' },
  E_WALLET: { label: 'E-Wallet', icon: Wallet, color: 'bg-orange-100 text-orange-700' },
  TRANSFER: { label: 'Transfer', icon: CreditCard, color: 'bg-cyan-100 text-cyan-700' },
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  SERVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-yellow-100 text-yellow-700',
};

export default function SalesDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<GuestOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch today's sales summary
  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['today-sales'],
    queryFn: () => apiService.getTodaySales(),
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['transactions', statusFilter, paymentFilter],
    queryFn: async () => {
      // Since API might not have transactions endpoint, we use orders
      const orders = await apiService.getOrders();
      // Filter for completed/paid orders
      return orders.filter(
        (o) => o.payment_status === 'PAID' || o.status === 'SERVED'
      ) as GuestOrder[];
    },
  });

  // Calculate stats
  const totalSales = salesData?.total_sales || 0;
  const totalOrders = salesData?.total_orders || 0;
  const totalItems = salesData?.total_items || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Payment method breakdown
  const paymentBreakdown = transactions.reduce((acc, tx) => {
    const method = tx.payment_method;
    if (!acc[method]) acc[method] = { count: 0, amount: 0 };
    acc[method].count++;
    acc[method].amount += tx.total_amount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = !statusFilter || tx.status === statusFilter;
    const matchesPayment = !paymentFilter || tx.payment_method === paymentFilter;
    const matchesSearch =
      !searchTerm ||
      tx.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const handleViewDetail = (tx: GuestOrder) => {
    setSelectedTransaction(tx);
    setIsDetailModalOpen(true);
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this transaction?')) {
      try {
        await apiService.cancelOrder(id);
        refetchTx();
        refetchSales();
      } catch (error: any) {
        alert(error.message || 'Failed to cancel transaction');
      }
    }
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your restaurant's performance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                refetchSales();
                refetchTx();
              }}
              className="btn btn-outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Today</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {salesLoading ? '...' : formatCurrency(totalSales)}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {salesLoading ? '...' : totalOrders}
            </p>
            <p className="text-sm text-gray-500 mt-1">{totalItems} items sold</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Avg. Order Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {salesLoading ? '...' : formatCurrency(avgOrderValue)}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">Customers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {txLoading ? '...' : transactions.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Today</p>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {Object.entries(PAYMENT_METHODS).map(([key, { label, icon: Icon, color }]) => {
                const data = paymentBreakdown[key as PaymentMethod];
                const percentage = totalSales > 0 ? ((data?.amount || 0) / totalSales) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{label}</span>
                        <span className="text-sm text-gray-600">
                          {data?.count || 0} orders • {formatCurrency(data?.amount || 0)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-sm text-gray-600">Gross Sales</span>
                <span className="font-bold text-green-700">{formatCurrency(totalSales)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-gray-600">Tax (11%)</span>
                <span className="font-bold text-blue-700">{formatCurrency(totalSales * 0.11)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm text-gray-600">Net Sales</span>
                <span className="font-bold text-purple-700">{formatCurrency(totalSales * 0.89)}</span>
              </div>
              <div className="h-px bg-gray-200 my-2" />
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalSales)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="SERVED">Served</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="input"
              >
                <option value="">All Methods</option>
                {Object.entries(PAYMENT_METHODS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => {
                  const paymentInfo = PAYMENT_METHODS[tx.payment_method];
                  const PaymentIcon = paymentInfo.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          #{tx.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{tx.customer_name}</p>
                          <p className="text-sm text-gray-500">Table {tx.table_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{tx.items.length} items</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${paymentInfo.color}`}>
                          <PaymentIcon className="w-3 h-3" />
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(tx.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge badge-sm ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-700'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(tx)}
                            className="btn btn-xs btn-outline"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && !txLoading && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {isDetailModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Order #{selectedTransaction.order_number}</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-bold text-gray-900">{selectedTransaction.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-bold text-gray-900">{selectedTransaction.table_number}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <span className="font-medium">{item.product_name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (11%)</span>
                  <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
                </div>
                {selectedTransaction.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTransaction.discount_amount)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedTransaction.total_amount)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  PAYMENT_METHODS[selectedTransaction.payment_method].color
                }`}>
                  {PAYMENT_METHODS[selectedTransaction.payment_method].label}
                </span>
              </div>

              {/* Actions */}
              {selectedTransaction.status !== 'CANCELLED' && (
                <button
                  onClick={() => {
                    handleCancel(selectedTransaction.id);
                    setIsDetailModalOpen(false);
                  }}
                  className="btn btn-danger w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
