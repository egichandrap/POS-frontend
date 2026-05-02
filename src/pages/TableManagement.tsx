import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [showQR, setShowQR] = useState<string | null>(null);

  // Fetch tables
  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['tables', statusFilter, locationFilter],
    queryFn: () => apiService.getTables({
      status: statusFilter || undefined,
      location: locationFilter || undefined,
    }),
  });

  // Create table mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTableRequest) => apiService.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
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
    mutationFn: (id: string) => apiService.generateQRCode(id),
    onSuccess: (qrCode) => {
      setShowQR(qrCode);
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

  const filteredTables = tables.filter((table) => {
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
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
                className="input"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div key={table.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl font-bold text-primary-600">{table.number}</span>
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
                  <button
                    onClick={() => qrMutation.mutate(table.id)}
                    className="btn btn-xs btn-outline flex-1"
                    disabled={qrMutation.isPending}
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    QR
                  </button>
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Table QR Code</h2>
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-4">
              <img src={showQR} alt="QR Code" className="w-full h-auto" />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Scan to view menu for this table
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = showQR;
                  link.download = `table-qr.png`;
                  link.click();
                }}
                className="btn btn-primary flex-1"
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQR(null)}
                className="btn btn-outline flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
