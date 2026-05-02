import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import type { GuestOrder } from '../types';
import toast from 'react-hot-toast';
import {
  ChefHat,
  Clock,
  Check,
  X,
  RefreshCw,
  UtensilsCrossed,
  Bell,
  TrendingUp,
  Filter,
  AlertCircle,
} from 'lucide-react';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED';

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; textColor: string; next: OrderStatus | null }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', next: 'PREPARING' },
  PREPARING: { label: 'Preparing', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', next: 'READY' },
  READY: { label: 'Ready', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', next: 'SERVED' },
  SERVED: { label: 'Served', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', next: null },
};

export default function KitchenDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersRef = useRef<Set<string>>(new Set());

  // Fetch orders based on active tab
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-orders', activeTab, statusFilter],
    queryFn: async () => {
      if (activeTab === 'pending') {
        return apiService.getPendingOrders();
      } else if (activeTab === 'active') {
        return apiService.getActiveOrders();
      }
      return apiService.getOrders({ status: statusFilter || undefined });
    },
    refetchInterval: 5000,
  });

  // Play notification sound when new orders arrive
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id));
    const newOrders = orders.filter(o => o.status === 'PENDING' && !prevOrdersRef.current.has(o.id));

    if (newOrders.length > 0 && prevOrdersRef.current.size > 0) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      toast.success(`${newOrders.length} new order(s)!`, {
        icon: '🔔',
        duration: 3000,
      });
    }

    prevOrdersRef.current = currentOrderIds;
  }, [orders]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiService.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success(`Order marked as ${STATUS_CONFIG[variables.status].label}!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order');
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success('Order cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  const handleNextStatus = (order: GuestOrder) => {
    const currentConfig = STATUS_CONFIG[order.status as OrderStatus];
    if (currentConfig.next) {
      updateStatusMutation.mutate({ id: order.id, status: currentConfig.next });
    }
  };

  const handlePrevStatus = (order: GuestOrder) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
    if (currentIndex > 0) {
      const prevStatus = STATUS_FLOW[currentIndex - 1];
      updateStatusMutation.mutate({ id: order.id, status: prevStatus });
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const filteredOrders = orders.filter((order) => {
    if (!statusFilter) return true;
    return order.status === statusFilter;
  });

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAoKJZPl" type="audio/wav" />
      </audio>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage incoming orders</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Preparing</p>
                <p className="text-2xl font-bold text-gray-900">{preparingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ready</p>
                <p className="text-2xl font-bold text-gray-900">{readyCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'pending', label: 'Pending', icon: Clock, count: pendingCount, color: 'bg-yellow-500' },
                { key: 'active', label: 'Active', icon: UtensilsCrossed, count: preparingCount + readyCount, color: 'bg-orange-500' },
                { key: 'all', label: 'All Orders', icon: TrendingUp, count: orders.length, color: 'bg-gray-500' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key ? 'bg-white/20' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
                className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                {STATUS_FLOW.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const config = STATUS_CONFIG[order.status as OrderStatus];
              const isPending = order.status === 'PENDING';
              const isUrgent = new Date(order.created_at).getTime() + 30 * 60000 < Date.now();

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 hover:shadow-md transition-all ${
                    isPending
                      ? 'border-l-yellow-500'
                      : isUrgent
                        ? 'border-l-red-500'
                        : order.status === 'READY'
                          ? 'border-l-emerald-500'
                          : 'border-l-orange-500'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">Order #{order.order_number}</h3>
                        {isPending && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            NEW
                          </span>
                        )}
                        {isUrgent && !isPending && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            LATE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="font-medium">Table {order.table_number}</span>
                        <span>•</span>
                        <span>{order.customer_name}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-3 border-b border-gray-100">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeSince(order.created_at)}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-gray-800">{item.product_name}</span>
                        </div>
                        {item.notes && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg">
                            Note: {item.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-3 border-t border-gray-100 mb-4">
                    <span className="text-sm text-gray-500 font-medium">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
                      <>
                        {order.status !== 'PENDING' && (
                          <button
                            onClick={() => handlePrevStatus(order)}
                            className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="w-3 h-3" />
                            Back
                          </button>
                        )}
                        <button
                          onClick={() => handleNextStatus(order)}
                          className={`flex-1 px-3 py-2.5 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm font-medium ${
                            order.status === 'READY'
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg hover:shadow-emerald-500/25'
                              : order.status === 'PENDING'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg hover:shadow-orange-500/25'
                          }`}
                          disabled={updateStatusMutation.isPending || !config.next}
                        >
                          {order.status === 'PENDING' && 'Confirm'}
                          {order.status === 'CONFIRMED' && 'Start Cooking'}
                          {order.status === 'PREPARING' && 'Mark Ready'}
                          {order.status === 'READY' && 'Mark Served'}
                          <Check className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this order?')) {
                            cancelMutation.mutate(order.id);
                          }
                        }}
                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        disabled={cancelMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">
              {activeTab === 'pending'
                ? 'New orders will appear here'
                : 'All caught up!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
