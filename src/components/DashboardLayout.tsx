import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', path: '/kitchen', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
  { name: 'Products', path: '/admin/inventory', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Tables', path: '/admin/tables', icon: UtensilsCrossed, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Customers', path: '/admin/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Reports', path: '/admin/sales', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  // Get current page name
  const getCurrentPageName = () => {
    const item = NAV_ITEMS.find((i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
    return item?.name || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200/60 shadow-xl lg:shadow-none transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          !sidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-slate-200/60">
            <div className={cn("flex items-center gap-3", sidebarCollapsed && "lg:justify-center w-full")}>
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="hidden lg:block">
                  <h1 className="font-bold text-lg text-slate-900">POS System</h1>
                  <p className="text-xs text-slate-500">Point of Sale</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-slate-200/60">
            {!sidebarCollapsed && (
              <div className="px-3 py-3 bg-slate-50 rounded-xl mb-2">
                <p className="font-semibold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.role.replace('_', ' ')}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{getCurrentPageName()}</h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Welcome back, {user?.full_name?.split(' ')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm ml-2 w-40 lg:w-56"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.role.replace('_', ' ')}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <span className="text-white font-semibold text-sm">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
