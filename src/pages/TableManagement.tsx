import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import { useAuthStore } from '../stores/auth';
import type { Table, CreateTableRequest, UpdateTableRequest } from '../types';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  RefreshCw,
  X,
  Check,
  Users,
  MapPin,
  UtensilsCrossed,
  Home,
  Armchair,
  Coffee,
} from 'lucide-react';

export default function TableManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [showQR, setShowQR] = useState<{ qrCode: string; table: Table } | null>(null);

  // Fetch tables
  const { data: tables = [], isLoading, refetch, error } = useQuery({
    queryKey: ['tables', statusFilter, locationFilter],
    queryFn: async () => {
      try {
        const result = await apiService.getTables({
          status: statusFilter || undefined,
          location: locationFilter || undefined,
        });
        return result;
      } catch (err) {
        throw err;
      }
    },
  });

  // Ensure tables is always an array
  const tablesList = Array.isArray(tables) ? tables : [];

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Create table mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTableRequest) => apiService.createTable(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      refetch();
      toast.success('Table added successfully!');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create table');
    },
  });

  // Update table mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableRequest }) =>
      apiService.updateTable(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      refetch();
      toast.success('Table updated successfully!');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update table');
    },
  });

  // Delete table mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTable(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      refetch();
      toast.success('Table deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete table');
    },
  });

  // Update table status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Table['status'] }) =>
      apiService.updateTableStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      refetch();
      toast.success('Status updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Generate QR mutation
  const qrMutation = useMutation({
    mutationFn: ({ id }: { id: string; table: Table }) => apiService.generateQRCode(id),
    onSuccess: (qrCode, variables) => {
      setShowQR({ qrCode, table: variables.table });
      toast.success('QR Code generated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate QR');
    },
  });

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
    } else {
      setEditingTable(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const handleQRClick = (table: Table) => {
    // If QR already exists, show it directly
    if (table.qr_code && table.qr_generated) {
      setShowQR({ qrCode: table.qr_code, table });
    } else {
      // Otherwise, generate new QR
      qrMutation.mutate({ id: table.id, table });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const tableData: CreateTableRequest | UpdateTableRequest = {
      number: parseInt(formData.get('number') as string),
      location: formData.get('location') as CreateTableRequest['location'],
      capacity: parseInt(formData.get('capacity') as string),
      description: formData.get('description') as string,
    };

    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data: tableData });
    } else {
      createMutation.mutate(tableData as CreateTableRequest);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', color: 'bg-emerald-500', icon: Check };
      case 'OCCUPIED':
        return { label: 'Occupied', color: 'bg-amber-500', icon: Users };
      case 'RESERVED':
        return { label: 'Reserved', color: 'bg-blue-500', icon: Coffee };
      case 'MAINTENANCE':
        return { label: 'Maintenance', color: 'bg-red-500', icon: X };
      default:
        return { label: status, color: 'bg-gray-500', icon: Check };
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'INDOOR': return Home;
      case 'OUTDOOR': return UtensilsCrossed;
      case 'VIP': return Armchair;
      case 'PATIO': return Coffee;
      default: return MapPin;
    }
  };

  const filteredTables = tablesList.filter((table) => {
    const matchesSearch = table.number.toString().includes(searchTerm) ||
      table.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const totalTables = tablesList.length;
  const availableTables = tablesList.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedTables = tablesList.filter((t) => t.status === 'OCCUPIED').length;
  const reservedTables = tablesList.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl xl:max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
            <p className="text-gray-500 mt-1">Manage restaurant tables and QR codes</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => refetch()} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={() => openModal()} className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-medium">
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">{totalTables}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Available</p>
                <p className="text-2xl font-bold text-emerald-600">{availableTables}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Occupied</p>
                <p className="text-2xl font-bold text-amber-600">{occupiedTables}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Coffee className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Reserved</p>
                <p className="text-2xl font-bold text-blue-600">{reservedTables}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by table number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
            {/* Filter Dropdowns */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="">All Locations</option>
                <option value="INDOOR">Indoor</option>
                <option value="OUTDOOR">Outdoor</option>
                <option value="VIP">VIP</option>
                <option value="PATIO">Patio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
            <p className="text-red-500 font-medium mb-2">Error loading tables</p>
            <p className="text-sm text-gray-500 mb-4">{(error as any)?.message || 'Unknown error'}</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => {
              const statusInfo = getStatusInfo(table.status);
              const StatusIcon = statusInfo.icon;
              const LocationIcon = getLocationIcon(table.location);

              return (
                <div key={table.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center relative">
                        <span className="text-2xl font-bold text-indigo-600">{table.number}</span>
                        {table.qr_generated && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <QrCode className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">Table {table.number}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <LocationIcon className="w-3.5 h-3.5" />
                          {table.location}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusInfo.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Capacity</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {table.capacity} seats
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-700 text-sm">{table.location}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {table.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{table.description}</p>
                  )}

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {table.status !== 'AVAILABLE' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: table.id, status: 'AVAILABLE' })}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                        disabled={statusMutation.isPending}
                      >
                        Available
                      </button>
                    )}
                    {table.status !== 'OCCUPIED' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: table.id, status: 'OCCUPIED' })}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        disabled={statusMutation.isPending}
                      >
                        Occupied
                      </button>
                    )}
                    {table.status !== 'RESERVED' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: table.id, status: 'RESERVED' })}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        disabled={statusMutation.isPending}
                      >
                        Reserved
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleQRClick(table)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                          table.qr_generated
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={qrMutation.isPending}
                      >
                        <QrCode className="w-4 h-4" />
                        {table.qr_generated ? 'View QR' : 'Generate'}
                      </button>
                    )}
                    <button
                      onClick={() => openModal(table)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete Table ${table.number}?`)) {
                          deleteMutation.mutate(table.id);
                        }
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

        {filteredTables.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No tables found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first table</p>
            <button onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all inline-flex items-center gap-2 font-medium">
              <Plus className="w-5 h-5" />
              Add First Table
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Table Number & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                  <input
                    type="number"
                    name="number"
                    defaultValue={editingTable?.number}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    defaultValue={editingTable?.capacity}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="4"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <select
                  name="location"
                  defaultValue={editingTable?.location || 'INDOOR'}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="INDOOR">Indoor</option>
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="VIP">VIP</option>
                  <option value="PATIO">Patio</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingTable?.description}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="Table description..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingTable ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Table QR Code</h2>
              <button
                onClick={() => setShowQR(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* QR Card - Printable Area */}
              <div id="qr-print-area" className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 sm:p-8">
                {/* Restaurant Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Scan to Order</h3>
                  <p className="text-base text-slate-600 mt-2">Table {showQR.table.number}</p>
                  {showQR.table.location && (
                    <p className="text-sm text-slate-500">{showQR.table.location}</p>
                  )}
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6">
                  <img
                    src={showQR.qrCode}
                    alt="QR Code"
                    className="w-full h-auto mx-auto"
                    style={{ maxWidth: '256px' }}
                  />
                </div>

                {/* Table Info */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500">Table Number</span>
                    <span className="text-2xl font-bold text-slate-900">{showQR.table.number}</span>
                  </div>
                  {showQR.table.capacity && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-500">Capacity</span>
                      <span className="font-medium text-slate-700">
                        <Users className="w-4 h-4 inline mr-1" />
                        {showQR.table.capacity} seats
                      </span>
                    </div>
                  )}
                  {showQR.table.description && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-slate-600 italic">{showQR.table.description}</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">1.</span> Open your camera or QR scanner
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">2.</span> Point at this QR code to view our menu
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">3.</span> Place your order directly from your phone
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => {
                    const printContent = document.getElementById('qr-print-area');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Table ${showQR.table.number} - QR Code</title>
                            <style>
                              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; background: #f1f5f9; }
                              .qr-card { text-align: center; max-width: 400px; }
                              .qr-card img { max-width: 256px; }
                            </style>
                          </head>
                          <body>${printContent.innerHTML}</body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.onload = () => {
                          printWindow.focus();
                          printWindow.print();
                        };
                      }
                    }
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h2z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = showQR.qrCode;
                    link.download = `table-${showQR.table.number}-qr.png`;
                    link.click();
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4 4m-4-4h8" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
