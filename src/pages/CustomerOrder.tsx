import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import { useCartStore } from '../stores/cart';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  UtensilsCrossed, 
  Flame, 
  Clock,
  Star,
  ChevronRight,
  X
} from 'lucide-react';

export default function CustomerOrder() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get('table') || '0');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { setTableInfo, addItem, itemCount, subtotal } = useCartStore();
  
  // Load products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts(),
  });

  useEffect(() => {
    if (tableId && tableNumber) {
      setTableInfo(tableId, tableNumber);
    }
  }, [tableId, tableNumber, setTableInfo]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('❌ Stok habis', {
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
      });
      return;
    }
    addItem(product, 1);
    toast.success(`✅ ${product.name} ditambahkan`, {
      style: {
        background: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-accent/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-morph">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                  🍽️ Restaurant Menu
                </h1>
                {tableNumber && (
                  <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    <span>Meja #{tableNumber} • Online</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Cart Button */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-primary text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5" />
                {itemCount() > 0 && (
                  <span className="bg-white text-primary-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce-slow">
                    {itemCount()}
                  </span>
                )}
                <span className="font-semibold">
                  Rp {subtotal().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="card-premium p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Cari menu favorit Anda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12 bg-white/50 backdrop-blur-sm border-neutral-200/50 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'popular', 'new', 'promo'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white/50 text-neutral-600 hover:bg-white hover:shadow-soft'
                  }`}
                >
                  {category === 'all' && '🍴 Semua'}
                  {category === 'popular' && '🔥 Populer'}
                  {category === 'new' && '✨ Baru'}
                  {category === 'promo' && '🎉 Promo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-premium p-4 animate-pulse">
                <div className="h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl mb-4 skeleton" />
                <div className="h-6 bg-neutral-200 rounded mb-2 skeleton w-3/4" />
                <div className="h-4 bg-neutral-200 rounded mb-3 skeleton" />
                <div className="flex justify-between">
                  <div className="h-8 bg-neutral-200 rounded skeleton w-24" />
                  <div className="h-10 bg-neutral-200 rounded-xl skeleton w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="card-premium group cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 rounded-t-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <UtensilsCrossed className="w-12 h-12 text-gradient" />
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.quantity <= 5 && product.quantity > 0 && (
                      <span className="badge badge-warning badge-pulse">
                        <Flame className="w-3 h-3" />
                        Sisa {product.quantity}
                      </span>
                    )}
                    {product.quantity === 0 && (
                      <span className="badge badge-danger">
                        <X className="w-3 h-3" />
                        Habis
                      </span>
                    )}
                    {product.quantity > 10 && (
                      <span className="badge badge-success">
                        <Star className="w-3 h-3" />
                        Ready
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.quantity <= 0}
                    className="absolute bottom-3 right-3 w-12 h-12 bg-gradient-primary text-white rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Estimasi 15-20 menit</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity <= 0}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-lg">Menu tidak ditemukan</p>
            <p className="text-neutral-400 text-sm mt-2">Coba kata kunci lain</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {itemCount() > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-60 group-hover:opacity-80 animate-pulse-slow" />
            <a
              href="/cart"
              className="relative bg-gradient-primary text-white px-6 py-4 rounded-2xl shadow-2xl shadow-primary-500/40 flex items-center gap-4 hover:scale-105 transition-transform"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-primary-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-slow">
                  {itemCount()}
                </span>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div>
                <p className="text-xs opacity-80">Total Order</p>
                <p className="text-lg font-bold">Rp {subtotal().toLocaleString('id-ID')}</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
