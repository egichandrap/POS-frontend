import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  CheckCircle2,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, color, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 text-left w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
            changeType === 'up' ? 'bg-emerald-50 text-emerald-700' :
            changeType === 'down' ? 'bg-red-50 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {changeType === 'up' && <ArrowUpRight className="w-4 h-4" />}
            {changeType === 'down' && <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </button>
  );
}

interface RecentActivityProps {
  title: string;
  items: Array<{
    id: string;
    name: string;
    status: string;
    amount?: number;
    time: string;
  }>;
}

function RecentActivity({ title, items }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
              item.status === 'pending' ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              {item.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
              {item.status === 'pending' && <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{item.name}</p>
              <p className="text-sm text-slate-500">{item.time}</p>
            </div>
            {item.amount && (
              <span className="font-semibold text-slate-900">
                Rp {item.amount.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Sample data for now
  const totalSales = 2500000;
  const totalOrders = 45;
  const totalItems = 128;
  const avgOrderValue = totalSales / totalOrders;
  const availableTables = 8;
  const occupiedTables = 4;
  const preparingOrders = 3;
  const pendingOrders = 2;
  const readyOrders = 1;

  // Sample recent orders
  const recentOrders = [
    { id: '1', name: 'Order #ORD-001', status: 'completed' as const, amount: 150000, time: '10:30' },
    { id: '2', name: 'Order #ORD-002', status: 'completed' as const, amount: 85000, time: '10:15' },
    { id: '3', name: 'Order #ORD-003', status: 'pending' as const, amount: 120000, time: '10:00' },
    { id: '4', name: 'Order #ORD-004', status: 'completed' as const, amount: 200000, time: '09:45' },
    { id: '5', name: 'Order #ORD-005', status: 'pending' as const, amount: 95000, time: '09:30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Revenue"
          value={`Rp ${totalSales.toLocaleString('id-ID')}`}
          change={12}
          changeType="up"
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-600"
          onClick={() => navigate('/admin/sales')}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          change={8}
          changeType="up"
          icon={ShoppingCart}
          color="bg-blue-100 text-blue-600"
          onClick={() => navigate('/kitchen')}
        />
        <StatCard
          title="Products Sold"
          value={totalItems}
          icon={Package}
          color="bg-violet-100 text-violet-600"
          onClick={() => navigate('/admin/inventory')}
        />
        <StatCard
          title="Avg. Order Value"
          value={`Rp ${Math.round(avgOrderValue).toLocaleString('id-ID')}`}
          change={5}
          changeType="down"
          icon={TrendingUp}
          color="bg-amber-100 text-amber-600"
          onClick={() => navigate('/admin/sales')}
        />
      </div>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/kitchen')}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-sm font-medium">New Order</span>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all"
            >
              <Package className="w-6 h-6" />
              <span className="text-sm font-medium">Products</span>
            </button>
            <button
              onClick={() => navigate('/admin/sales')}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm font-medium">Reports</span>
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all"
            >
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Customers</span>
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-sm text-slate-600">Available</span>
              </div>
              <span className="font-semibold text-slate-900">{availableTables}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-sm text-slate-600">Occupied</span>
              </div>
              <span className="font-semibold text-slate-900">{occupiedTables}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-600">Pending</span>
              </div>
              <span className="font-semibold text-slate-900">{pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-600">Preparing</span>
              </div>
              <span className="font-semibold text-slate-900">{preparingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-slate-600">Ready</span>
              </div>
              <span className="font-semibold text-slate-900">{readyOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity title="Recent Orders" items={recentOrders} />

        {/* Performance Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Today's Target</span>
                <span className="text-sm font-medium text-slate-900">50%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Peak Hours</p>
                <p className="font-semibold text-slate-900">12:00 - 14:00</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Avg. Time</p>
                <p className="font-semibold text-slate-900">15 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
