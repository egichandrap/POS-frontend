# POS Restaurant Frontend - React + TypeScript

Frontend application untuk **QR Table Ordering System** restaurant yang terintegrasi dengan backend POS API.

## 🚀 Features

### ✅ Customer-Facing (Mobile-Optimized)
- **Browse Menu** - Lihat semua produk dari inventory
- **Cart Management** - Tambah, update, hapus item
- **Order Placement** - Buat order langsung dari meja
- **Order Tracking** - Track status order secara real-time
- **Responsive Design** - Optimized untuk mobile devices

### ✅ Staff Dashboard
- **Kitchen Dashboard** - Lihat & kelola order masuk
- **Order Status Management** - Update order status
- **Table Management** - Kelola meja & generate QR codes (Admin)
- **Sales Reports** - Lihat penjualan hari ini

## 📁 Project Structure

```
jwt-ddd-clean-frontend/
├── src/
│   ├── components/           # Reusable components
│   │   └── AuthProvider.tsx
│   ├── pages/                # Page components
│   │   ├── CustomerOrder.tsx    # Customer menu & ordering
│   │   ├── Cart.tsx             # Shopping cart
│   │   ├── OrderTracking.tsx    # Order status tracking
│   │   ├── KitchenDashboard.tsx # Kitchen staff dashboard
│   │   ├── TableManagement.tsx  # Admin table management
│   │   └── Login.tsx            # Staff login
│   ├── services/             # API services
│   │   ├── api.ts               # API configuration
│   │   └── api-client.ts        # API client with all endpoints
│   ├── stores/               # Zustand stores
│   │   ├── auth.ts              # Authentication state
│   │   └── cart.ts              # Shopping cart state
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind CSS + custom styles
├── public/
├── tailwind.config.js
├── vite.config.ts
├── package.json
└── README.md
```

## 🛠️ Tech Stack

- **React 18+** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Query** - Data fetching & caching
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Backend POS API running (jwt-ddd-clean)

## 🚀 Quick Start

### 1. Installation

```bash
cd jwt-ddd-clean-frontend
npm install
```

### 2. Configuration

Buat file `.env` di root folder:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Ubah URL sesuai backend Anda.

### 3. Development

```bash
npm run dev
```

App akan running di `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 📱 Pages & Routes

### Customer Pages (No Authentication)

| Route | Description | Component |
|-------|-------------|-----------|
| `/order/:tableId` | Browse menu & order | CustomerOrder |
| `/cart` | Shopping cart | Cart |
| `/order/:orderId/tracking` | Track order status | OrderTracking |

### Staff Pages (Authentication Required)

| Route | Description | Component | Roles |
|-------|-------------|-----------|-------|
| `/login` | Staff login | Login | Public |
| `/kitchen` | Kitchen dashboard | KitchenDashboard | SUPER_ADMIN, ADMIN, CASHIER |
| `/admin/tables` | Table management | TableManagement | SUPER_ADMIN, ADMIN |

## 🔌 API Integration

Semua API calls ada di `src/services/api-client.ts`:

### Authentication
```typescript
apiService.login({ username, password })
apiService.logout()
apiService.getMe()
```

### Tables (Admin)
```typescript
apiService.getTables()
apiService.createTable(data)
apiService.generateQRCode(tableId)
```

### Guest Orders (Public)
```typescript
apiService.createGuestOrder(data)
apiService.addOrderItem(orderId, item)
apiService.checkoutOrder(orderId, payment)
```

### Order Management (Staff)
```typescript
apiService.getPendingOrders()
apiService.updateOrderStatus(orderId, status)
```

### Inventory (Public)
```typescript
apiService.getProducts()
```

## 🎨 UI Components

### Button Variants
```tsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-danger">Danger</button>
```

### Badges
```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Cancelled</span>
<span className="badge badge-info">Info</span>
```

### Cards & Inputs
```tsx
<div className="card">
  <input className="input" placeholder="Enter text" />
</div>
```

## 📊 State Management

### Auth Store
```typescript
import { useAuthStore } from './stores/auth';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Cart Store
```typescript
import { useCartStore } from './stores/cart';

const { items, addItem, removeItem, subtotal, itemCount } = useCartStore();
```

## 🔐 Authentication Flow

1. **Staff Login**: Username & password → JWT token
2. **Token Storage**: Stored in localStorage
3. **Auto-Refresh**: Token loaded on app start
4. **Protected Routes**: Role-based access control

## 🛒 Order Flow

### Customer Journey
```
1. Scan QR Code at table
   ↓
2. Opens: /order/{tableId}?table={number}
   ↓
3. Browse menu & add to cart
   ↓
4. Go to cart & fill customer info
   ↓
5. Create order → Redirect to tracking
   ↓
6. Track order status in real-time
```

### Staff Journey
```
1. Login to system
   ↓
2. Kitchen: View pending orders
   ↓
3. Update status: PENDING → CONFIRMED → PREPARING → READY → SERVED
   ↓
4. Table automatically marked AVAILABLE when SERVED
```

## 🎯 Key Features Implementation

### Shopping Cart
- Stored in Zustand (client-side)
- Sync to backend on order creation
- Stock validation before add
- Auto-calculate subtotal & total

### Order Tracking
- Real-time status updates
- Visual progress indicator
- Auto-refresh every 30 seconds

### Table Context
- Extracted from URL params
- Auto-set in cart store
- Required for order creation

## 🐛 Debugging

### Enable Debug Mode
```typescript
// In api-client.ts
this.client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add interceptor for logging
this.client.interceptors.request.use(req => {
  console.log('Request:', req);
  return req;
});
```

### Common Issues

**Issue: CORS Error**
```
Solution: Add CORS middleware di backend
```

**Issue: Token Expired**
```
Solution: Implement refresh token logic
```

**Issue: Products Not Loading**
```
Check: Backend running? Inventory has data?
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output di `dist/` folder.

### Deploy Options

**Option 1: Static Hosting**
- Vercel
- Netlify
- GitHub Pages

**Option 2: Serve from Backend**
- Build React app
- Serve dari Go static file server
- Same domain = no CORS issues

### Environment Variables

```env
# Development
VITE_API_BASE_URL=http://localhost:8080/api

# Production
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow existing naming conventions
- Use functional components with hooks
- Keep components small & focused

### Component Structure
```tsx
import { useState } from 'react';
import { SomeComponent } from '../components/SomeComponent';

export default function MyPage() {
  // State
  // Effects
  // Handlers
  // Render
}
```

### API Calls
- Use React Query for data fetching
- Handle loading & error states
- Show toast notifications

## 📚 Resources

- [Backend API Documentation](../jwt-ddd-clean/docs/QR_TABLE_IMPLEMENTATION_GUIDE.md)
- [React Documentation](https://react.dev)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License

---

**Version**: 1.0.0  
**Last Updated**: April 4, 2026  
**Status**: Development In Progress ✅
