import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import {
  UtensilsCrossed,
  TableProperties,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  onClick?: () => void;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Fetch today's sales
  const { data: salesData } = useQuery({
    queryKey: ['today-sales'],
    queryFn: () => apiService.getTodaySales(),
  });

  // Fetch tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => apiService.getTables(),
  });

  // Fetch active orders
  const { data: activeOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => apiService.getActiveOrders(),
  });

  // Calculate stats
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const preparingOrders = activeOrders.filter((o) => o.status === 'PREPARING').length;
  const readyOrders = activeOrders.filter((o) => o.status === 'READY').length;

  const stats: StatCard[] = [
    {
      title: "Today's Sales",
      value: salesData ? `Rp ${salesData.total_sales.toLocaleString('id-ID')}` : 'Rp 0',
      change: salesData?.total_orders ? `${salesData.total_orders} orders` : undefined,
      changeType: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/sales'),
    },
    {
      title: 'Available Tables',
      value: tablesLoading ? '...' : availableTables,
      change: `of ${tables.length} total`,
      changeType: 'neutral',
      icon: TableProperties,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/tables'),
    },
    {
      title: 'Active Orders',
      value: ordersLoading ? '...' : activeOrders.length,
      change: `${preparingOrders} preparing`,
      changeType: 'neutral',
      icon: Clock,
      color: 'bg-orange-500',
      onClick: () => navigate('/kitchen'),
    },
    {
      title: 'Ready to Serve',
      value: ordersLoading ? '...' : readyOrders,
      changeType: 'up',
      icon: UtensilsCrossed,
      color: 'bg-purple-500',
      onClick: () => navigate('/kitchen'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <button
              key={index}
              onClick={stat.onClick}
              className="card p-6 text-left hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.changeType && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.changeType === 'up' ? 'text-green-600' : stat.changeType === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.changeType === 'up' && <TrendingUp className="w-4 h-4" />}
                    {stat.changeType === 'down' && <TrendingDown className="w-4 h-4" />}
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              {stat.change && (
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/kitchen')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Kitchen Display</p>
              <p className="text-sm text-gray-500">View active orders</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/admin/tables')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <TableProperties className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Tables</p>
              <p className="text-sm text-gray-500">Update table status</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Inventory</p>
              <p className="text-sm text-gray-500">Manage products</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">User Management</p>
              <p className="text-sm text-gray-500">Manage staff</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Status Overview */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Table Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-gray-900">Available</span>
              </div>
              <span className="text-xl font-bold text-green-600">{availableTables}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="font-medium text-gray-900">Occupied</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{occupiedTables}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="font-medium text-gray-900">Reserved</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {tables.filter((t) => t.status === 'RESERVED').length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="font-medium text-gray-900">Maintenance</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {tables.filter((t) => t.status === 'MAINTENANCE').length}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="font-medium text-gray-900">Pending</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {activeOrders.filter((o) => o.status === 'PENDING').length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="font-medium text-gray-900">Confirmed</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {activeOrders.filter((o) => o.status === 'CONFIRMED').length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="font-medium text-gray-900">Preparing</span>
              </div>
              <span className="text-xl font-bold text-orange-600">{preparingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-gray-900">Ready</span>
              </div>
              <span className="text-xl font-bold text-green-600">{readyOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
