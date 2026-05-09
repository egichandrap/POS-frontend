import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Check,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import type { Product } from '../types';

type RawMaterial = Product;

const rawMaterialsResponseToList = (res: any): RawMaterial[] => {
  // Postman contract: { success:true, data:{ materials: [...] , total, ... } }
  if (Array.isArray(res)) return res as RawMaterial[];
  if (res?.materials && Array.isArray(res.materials)) return res.materials as RawMaterial[];
  if (Array.isArray(res?.data?.materials)) return res.data.materials as RawMaterial[];
  return [];
};


const UNIT_OPTIONS = ['pcs', 'kg', 'gram', 'liter', 'ml', 'pack', 'box', 'bottle'] as const;

type CreateRawMaterialRequest = {
  sku: string;
  name: string;
  description?: string;
  unit: (typeof UNIT_OPTIONS)[number];
  quantity: number;
  min_stock: number;
  cost_per_unit: number;
  supplier?: string;
  location?: string;
};

type UpdateRawMaterialRequest = {
  name?: string;
  description?: string;
  unit?: (typeof UNIT_OPTIONS)[number];
  min_stock?: number;
  cost_per_unit?: number;
  supplier?: string;
};

type AdjustStockRequest = {
  quantity: number;
  reason?: string;
};

export default function RawMaterialManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch raw materials
  const { data: materials = { materials: [] }, isLoading, refetch, error } = useQuery({
    queryKey: ['raw-materials', searchTerm],
    queryFn: async () => {
      // Log in console to help diagnose auth/response shape
      return apiService.getRawMaterials({
        search: searchTerm || undefined,
        limit: 100,
        offset: 0,
      });
    },
  });

  const materialsList = rawMaterialsResponseToList(materials);

  const createMutation = useMutation({
    mutationFn: (data: CreateRawMaterialRequest) => apiService.createRawMaterial(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Raw material created');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to create raw material'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRawMaterialRequest }) =>
      apiService.updateRawMaterial(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Raw material updated');
      closeModal();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update raw material'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustStockRequest }) =>
      apiService.adjustRawMaterialStock(id, data.quantity, data.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Stock adjusted');
      closeStockModal();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to adjust stock'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteRawMaterial(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast.success('Raw material deleted');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete raw material'),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const editingAny = editing as any;
  const [stockItem, setStockItem] = useState<RawMaterial | null>(null);

  const openModal = (item?: RawMaterial) => {
    setEditing(item || null);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const openStockModal = (item: RawMaterial) => {
    setStockItem(item);
    setIsStockModalOpen(true);
  };
  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setStockItem(null);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return materialsList;
    return materialsList.filter((m) => {
      return (
        (m.name || '').toLowerCase().includes(term) ||
        (m.sku || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term) ||
        (m.supplier || '').toLowerCase().includes(term) ||
        (m.location || '').toLowerCase().includes(term)
      );
    });
  }, [materialsList, searchTerm]);

  const getStockBadge = (m: RawMaterial) => {
    const minStock = m.min_stock ?? 10;
    if (m.quantity === 0) {
      return { label: 'Out of Stock', className: 'bg-red-500 text-white', Icon: X };
    }
    if (m.quantity <= minStock) {
      return { label: 'Low Stock', className: 'bg-amber-500 text-white', Icon: AlertTriangle };
    }
    return { label: 'In Stock', className: 'bg-emerald-500 text-white', Icon: Check };
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload: CreateRawMaterialRequest | UpdateRawMaterialRequest = {
      sku: fd.get('sku') as string,
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      unit: fd.get('unit') as any,
      quantity: Number(fd.get('quantity') || 0),
      min_stock: Number(fd.get('min_stock') || 0),
      cost_per_unit: Number(fd.get('cost_per_unit') || 0),
      supplier: fd.get('supplier') as string,
      location: fd.get('location') as string,
    };

    if (editing) {
      const updatePayload: UpdateRawMaterialRequest = {
        name: payload.name,
        description: payload.description,
        unit: payload.unit,
        min_stock: payload.min_stock,
        cost_per_unit: payload.cost_per_unit,
        supplier: payload.supplier,
      };
      updateMutation.mutate({ id: editing.id, data: updatePayload });
    } else {
      createMutation.mutate(payload as CreateRawMaterialRequest);
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stockItem) return;
    const fd = new FormData(e.currentTarget);
    const quantity = Number(fd.get('quantity') || 0);
    const reason = (fd.get('reason') as string) || undefined;
    adjustMutation.mutate({ id: stockItem.id, data: { quantity, reason } });
  };

  const total = materialsList.length;
  const low = materialsList.filter((m) => m.quantity > 0 && m.quantity <= (m.min_stock ?? 10)).length;
  const out = materialsList.filter((m) => m.quantity === 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
            <p className="text-gray-500 mt-1">Manage ingredients & stock</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => openModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{low}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{out}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Healthy Stock</p>
                <p className="text-2xl font-bold text-emerald-600">{total - low - out}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, SKU, supplier, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-red-500 font-medium mb-2">Error loading raw materials</p>
            <p className="text-sm text-gray-500 mb-4">
              {(error as any)?.message || (error as any)?.toString?.() || 'Unknown error'}
            </p>
            <div className="text-xs text-gray-400 mb-4">
              token in localStorage: {localStorage.getItem('token') ? 'FOUND' : 'MISSING'}
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => {
              const badge = getStockBadge(m);
              const Icon = badge.Icon;
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{m.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{m.sku}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>

                  {m.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{m.description}</p>}

                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock</p>
                      <p className="font-semibold text-gray-900">{m.quantity} {m.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Min</p>
                      <p className="font-semibold text-gray-900">{m.min_stock ?? 10} {m.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cost/Unit</p>
                      <p className="font-semibold text-gray-900">Rp {(m.cost_per_unit || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm text-gray-700">{m.location || '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openStockModal(m)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Adjust Stock
                    </button>
                    <button
                      onClick={() => openModal(m)}
                      className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${m.name}"?`)) deleteMutation.mutate(m.id);
                      }}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Raw Material' : 'Add Raw Material'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU {editing ? '' : '*'}</label>
                  <input
                    type="text"
                    name="sku"
                    defaultValue={editing?.sku}
                    required={!editing}
                    disabled={!!editing}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <select
                    name="unit"
                    defaultValue={editing?.unit || 'kg'}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editing?.name}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editing?.description}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              {!editing && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                      <input
                      type="number"
                      name="quantity"
                      defaultValue={editingAny?.quantity || 0}

                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock *</label>
                      <input
                      type="number"
                      name="min_stock"
                      defaultValue={editingAny?.min_stock ?? 10}

                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost/Unit *</label>
                      <input
                      type="number"
                      name="cost_per_unit"
                      defaultValue={editingAny?.cost_per_unit || 0}

                      required
                      min="0"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    defaultValue={editing?.supplier || ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editing?.location || ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {isStockModalOpen && stockItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Adjust Stock</h2>
              <p className="text-sm text-gray-500 mt-1">{stockItem.name}</p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (positive/negative)</label>
                <input
                  type="number"
                  name="quantity"
                  defaultValue={0}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Positive = add stock, Negative = reduce stock</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="Restock / wastage / adjustment..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeStockModal} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium" disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? 'Saving...' : 'Adjust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

