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
  AlertCircle
} from 'lucide-react';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED';

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; next: OrderStatus | null }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-100', next: 'PREPARING' },
  PREPARING: { label: 'Preparing', color: 'text-orange-600', bgColor: 'bg-orange-100', next: 'READY' },
  READY: { label: 'Ready', color: 'text-green-600', bgColor: 'bg-green-100', next: 'SERVED' },
  SERVED: { label: 'Served', color: 'text-gray-600', bgColor: 'bg-gray-100', next: null },
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
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Play notification sound when new orders arrive
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id));
    const newOrders = orders.filter(o => o.status === 'PENDING' && !prevOrdersRef.current.has(o.id));
    
    if (newOrders.length > 0 && prevOrdersRef.current.size > 0) {
      // New pending order arrived - play sound
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
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAoKJZPl" type="audio/wav" />
      </audio>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                <p className="text-sm text-gray-500">Manage incoming orders</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-700">{pendingCount}</span>
                <span className="text-sm text-yellow-600">Pending</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-xl">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-700">{preparingCount}</span>
                <span className="text-sm text-orange-600">Preparing</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">{readyCount}</span>
                <span className="text-sm text-green-600">Ready</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className="btn btn-outline"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs & Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { key: 'pending', label: 'Pending', icon: Clock, count: pendingCount },
                { key: 'active', label: 'Active', icon: UtensilsCrossed, count: preparingCount + readyCount },
                { key: 'all', label: 'All', icon: TrendingUp, count: orders.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
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
                className="input"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const config = STATUS_CONFIG[order.status as OrderStatus];
              const isPending = order.status === 'PENDING';
              const isUrgent = new Date(order.created_at).getTime() + 30 * 60000 < Date.now();

              return (
                <div 
                  key={order.id} 
                  className={`card p-4 border-l-4 transition-all hover:shadow-lg ${
                    isPending 
                      ? 'border-l-yellow-500 bg-yellow-50/50' 
                      : isUrgent 
                        ? 'border-l-red-500 bg-red-50/50' 
                        : `border-l-${order.status === 'READY' ? 'green' : 'orange'}-500`
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                        {isPending && (
                          <span className="badge badge-warning badge-sm animate-pulse">
                            <Bell className="w-3 h-3" />
                            NEW
                          </span>
                        )}
                        {isUrgent && (
                          <span className="badge badge-danger badge-sm">
                            <AlertCircle className="w-3 h-3" />
                            LATE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Table {order.table_number} • {order.customer_name}
                      </p>
                    </div>
                    <span className={`badge ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeSince(order.created_at)}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.product_name}</span>
                        </div>
                        {item.notes && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-3 border-t mb-3">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-lg font-bold">
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
                            className="btn btn-outline btn-sm flex-1"
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Back
                          </button>
                        )}
                        <button
                          onClick={() => handleNextStatus(order)}
                          className={`btn btn-sm flex-1 ${
                            order.status === 'READY' 
                              ? 'btn-success' 
                              : order.status === 'PENDING'
                                ? 'btn-primary'
                                : 'btn-warning'
                          }`}
                          disabled={updateStatusMutation.isPending || !config.next}
                        >
                          {order.status === 'PENDING' && 'Confirm'}
                          {order.status === 'CONFIRMED' && 'Start'}
                          {order.status === 'PREPARING' && 'Done'}
                          {order.status === 'READY' && 'Serve'}
                          <Check className="w-3 h-3 ml-1" />
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
                        className="btn btn-danger btn-sm"
                        disabled={cancelMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No orders in queue</p>
            <p className="text-gray-400 text-sm mt-2">
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
