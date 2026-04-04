
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api-client';
import { CheckCircle, Clock, Utensils } from 'lucide-react';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiService.getGuestOrder(orderId!),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Order not found</div>;
  }

  const statusSteps = [
    { status: 'PENDING', label: 'Diterima', icon: Clock, color: 'text-yellow-600' },
    { status: 'CONFIRMED', label: 'Dikonfirmasi', icon: CheckCircle, color: 'text-blue-600' },
    { status: 'PREPARING', label: 'Disiapkan', icon: Utensils, color: 'text-orange-600' },
    { status: 'READY', label: 'Siap', icon: Utensils, color: 'text-green-600' },
    { status: 'SERVED', label: 'Diantar', icon: CheckCircle, color: 'text-green-700' },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h1 className="text-2xl font-bold mb-2">Tracking Pesanan</h1>
          <p className="text-gray-600">Order #{order.order_number}</p>
          <p className="text-sm text-gray-500">Meja #{order.table_number}</p>
        </div>

        {/* Status Timeline */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-6">Status Pesanan</h2>
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${isCompleted ? step.color : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${isCurrent ? 'text-primary-600' : ''}`}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-gray-500">{step.status}</p>
                  </div>
                  {isCurrent && (
                    <span className="badge badge-info">Saat ini</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Detail Pesanan</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <p className="font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary-600">Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {order.status === 'SERVED' && (
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Kembali ke Menu
          </button>
        )}
      </div>
    </div>
  );
}
