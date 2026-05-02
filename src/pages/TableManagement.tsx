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
      console.log('[TableManagement] Fetching tables with filters:', { statusFilter, locationFilter });
      try {
        const result = await apiService.getTables({
          status: statusFilter || undefined,
          location: locationFilter || undefined,
        });
        console.log('[TableManagement] Tables fetched:', result);
        return result;
      } catch (err) {
        console.error('[TableManagement] Error fetching tables:', err);
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
      toast.success('Table created successfully!');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'badge-success';
      case 'OCCUPIED':
        return 'badge-warning';
      case 'RESERVED':
        return 'badge-info';
      case 'MAINTENANCE':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  const filteredTables = tablesList.filter((table) => {
    const matchesSearch = table.number.toString().includes(searchTerm) ||
      table.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="text-gray-600 mt-1">Manage restaurant tables and QR codes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="btn btn-outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => openModal()}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by table number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
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
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center">
            <p className="text-red-500 mb-2">Error loading tables</p>
            <p className="text-sm text-gray-500 mb-4">
              {(error as any)?.message || 'Unknown error'}
            </p>
            <button onClick={() => refetch()} className="btn btn-outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div key={table.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center relative">
                      <span className="text-xl font-bold text-primary-600">{table.number}</span>
                      {table.qr_generated && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <QrCode className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Table {table.number}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {table.location}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(table.status)}`}>
                    {table.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {table.capacity} persons</span>
                </div>

                {table.description && (
                  <p className="text-sm text-gray-500 mb-4">{table.description}</p>
                )}

                {/* Status Actions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {table.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: table.id, status: 'AVAILABLE' })}
                      className="btn btn-xs btn-success"
                      disabled={statusMutation.isPending}
                    >
                      Available
                    </button>
                  )}
                  {table.status !== 'OCCUPIED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: table.id, status: 'OCCUPIED' })}
                      className="btn btn-xs btn-warning"
                      disabled={statusMutation.isPending}
                    >
                      Occupied
                    </button>
                  )}
                  {table.status !== 'RESERVED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: table.id, status: 'RESERVED' })}
                      className="btn btn-xs btn-info"
                      disabled={statusMutation.isPending}
                    >
                      Reserved
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleQRClick(table)}
                      className={`btn btn-xs flex-1 ${table.qr_generated ? 'btn-primary' : 'btn-outline'}`}
                      disabled={qrMutation.isPending}
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      {table.qr_generated ? 'View QR' : 'Generate QR'}
                    </button>
                  )}
                  <button
                    onClick={() => openModal(table)}
                    className="btn btn-xs btn-outline flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this table?')) {
                        deleteMutation.mutate(table.id);
                      }
                    }}
                    className="btn btn-xs btn-danger"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTables.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tables found</p>
            <button
              onClick={() => openModal()}
              className="btn btn-primary mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Table
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Number *</label>
                  <input
                    type="number"
                    name="number"
                    defaultValue={editingTable?.number}
                    required
                    min="1"
                    className="input"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    defaultValue={editingTable?.capacity}
                    required
                    min="1"
                    className="input"
                    placeholder="4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <select
                  name="location"
                  defaultValue={editingTable?.location || 'INDOOR'}
                  required
                  className="input"
                >
                  <option value="INDOOR">Indoor</option>
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="VIP">VIP</option>
                  <option value="PATIO">Patio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingTable?.description}
                  className="input"
                  rows={2}
                  placeholder="Table description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {editingTable ? 'Update' : 'Create'}
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
            {/* Header - Fixed position */}
            <div className="sticky top-0 bg-white rounded-t-2xl px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Table QR Code</h2>
              <button
                onClick={() => setShowQR(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
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
                  <p className="text-base text-slate-600 mt-1">Table {showQR.table.number}</p>
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
                <div className="text-center space-y-1">
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
                              .table-info { background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 20px; }
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
                  className="btn btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="btn btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
