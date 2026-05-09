import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerOrder from './pages/CustomerOrder';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import KitchenDashboard from './pages/KitchenDashboard';
import TableManagement from './pages/TableManagement';
import UserManagement from './pages/UserManagement';
import InventoryManagement from './pages/InventoryManagement';
import SalesDashboard from './pages/SalesDashboard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RawMaterialManagement from './pages/RawMaterialManagement';
import DashboardLayout from './components/DashboardLayout';
import { AuthProvider, ProtectedRoute } from './components/AuthProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status === 401 || status === 403) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              {/* Public Routes - Customer */}
              <Route path="/order/:tableId" element={<CustomerOrder />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order/:orderId/tracking" element={<OrderTracking />} />

              {/* Public Routes - Staff Login */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes - Staff Dashboard with Layout */}
              <Route element={
                <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'VIEWER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/kitchen" element={<KitchenDashboard />} />
                <Route path="/admin/inventory" element={<InventoryManagement />} />
                <Route path="/admin/raw-materials" element={<RawMaterialManagement />} />
                <Route path="/admin/sales" element={<SalesDashboard />} />
                <Route path="/admin/tables" element={<TableManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
