'use client';

import React, { useState, useEffect } from 'react';
import { Globe, AlertCircle, Truck, Package, CheckCircle, Clock, Search, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { orderService } from '@/services/orderService'; 

// Tipe Data
interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  customer: string;
  total: number;
  date: string;
  paymentMethod: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED'; 
  trackingId?: string; 
  courier?: string;    
  items: OrderItem[];
  address: string;
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState<'web' | 'marketplace'>('web');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ 
    show: false, message: '', type: 'success' 
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // 1. FETCH DATA REAL DARI API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
        const data = await orderService.getAllAdmin();
        
        // Mapping status backend ke frontend jika perlu (misal status DB: 'PENDING_PAYMENT')
        // Disini kita pakai raw data dulu, pastikan status di DB konsisten
        setOrders(data);
    } catch (error) {
        console.error(error);
        showToast("Gagal mengambil data pesanan", 'error');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. HANDLE UPDATE STATUS (BITESHIP TRIGGER)
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
        // Panggil API Backend
        const response = await orderService.updateStatus(orderId, newStatus);
        
        // Update State Lokal tanpa reload
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                return { 
                    ...order, 
                    status: newStatus as any,
                    // Jika ada trackingId baru dari backend (hasil generate Biteship), update juga
                    trackingId: response.trackingId || order.trackingId 
                };
            }
            return order;
        });

        setOrders(updatedOrders);
        
        // Update Modal yang sedang terbuka
        if (selectedOrder && selectedOrder.id === orderId) {
            const freshOrder = updatedOrders.find(o => o.id === orderId);
            if (freshOrder) setSelectedOrder(freshOrder);
        }

        showToast(`Status diperbarui: ${newStatus}`, 'success');

    } catch (error) {
        showToast("Gagal update status", 'error');
    } finally {
        setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Clock size={12}/> Belum Bayar</span>;
      case 'PAID': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> Dibayar</span>;
      case 'CONFIRMED': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> Dikonfirmasi</span>;
      case 'PACKED': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Package size={12}/> Dikemas</span>;
      case 'SHIPPED': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><Truck size={12}/> Dikirim</span>;
      case 'DELIVERED': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> Selesai</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const MARKETPLACE_DATA = [
    { source: 'Shopee', traffic: 1200, orders: 45, revenue: 4500000, status: 'Connected' },
    { source: 'Tokopedia', traffic: 800, orders: 30, revenue: 3200000, status: 'Connected' },
  ];

  return (
    <div className="relative w-full max-w-[100vw]">
      {/* Toast */}
      <div className={`fixed top-6 right-6 z-[120] transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border-l-4 bg-white ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
               {toast.type === 'success' ? <Check size={18}/> : <AlertTriangle size={18}/>}
            </div>
            <div>
               <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-gray-800' : 'text-red-600'}`}>
                 {toast.type === 'success' ? 'Sukses' : 'Gagal'}
               </h4>
               <p className="text-xs text-gray-500">{toast.message}</p>
            </div>
            <button onClick={() => setToast(prev => ({...prev, show: false}))} className="ml-4 text-gray-400 hover:text-gray-600"><X size={16}/></button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Monitoring Pesanan</h1>
      <p className="text-sm text-gray-500 mb-8">Pantau transaksi Real-time & Manajemen Pengiriman.</p>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <button 
          onClick={() => setActiveTab('web')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'web' ? 'border-[#F87B1B] text-[#F87B1B]' : 'border-transparent text-gray-500'}`}
        >
          Website Orders
          {orders.filter(o => o.status === 'PAID').length > 0 && (
             <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{orders.filter(o => o.status === 'PAID').length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'marketplace' ? 'border-[#F87B1B] text-[#F87B1B]' : 'border-transparent text-gray-500'}`}
        >
          E-commerce Bridge
        </button>
      </div>

      {activeTab === 'web' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Cari ID Pesanan / Pelanggan..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#F87B1B]" />
             </div>
             <button onClick={fetchOrders} className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100">Refresh</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-4">ID Pesanan</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status & Resi</th>
                  <th className="p-4">Kurir</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Memuat data pesanan...</td></tr>
                ) : orders.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada pesanan masuk.</td></tr>
                ) : (
                    orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold">{order.id}</td>
                        <td className="p-4">
                        <p className="font-bold text-gray-700">{order.customer}</p>
                        <p className="text-[10px] text-gray-400">{order.date}</p>
                        </td>
                        <td className="p-4 font-bold text-[#F87B1B]">Rp {order.total.toLocaleString()}</td>
                        <td className="p-4">
                        {getStatusBadge(order.status)}
                        {order.trackingId && <p className="text-[10px] text-gray-500 mt-1 font-mono flex items-center gap-1"><Truck size={10}/> {order.trackingId}</p>}
                        </td>
                        <td className="p-4 text-gray-600">{order.courier}</td>
                        <td className="p-4 text-right">
                        <button 
                            onClick={() => setSelectedOrder(order)}
                            className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                            Proses
                        </button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 mb-2">
            <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-bold">Google Sheet Mirroring Active</p>
              <p>Data transaksi dari marketplace ini akan otomatis ter-rekam ke Spreadsheet pembukuan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MARKETPLACE_DATA.map((mp) => (
              <div key={mp.source} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" /> {mp.source}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${mp.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{mp.status}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Traffic</span>
                    <span className="font-bold">{mp.traffic} Visit</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Orders</span>
                    <span className="font-bold">{mp.orders} Pcs</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-bold text-[#F87B1B]">Rp {mp.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL DETAIL ORDER --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Pesanan #{selectedOrder.id}</h2>
                        <p className="text-xs text-gray-500">{selectedOrder.date}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full flex-shrink-0"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6 overflow-y-auto space-y-6">
                    
                    {/* Status Tracker */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 min-w-[300px]">
                          {['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((step, idx, arr) => {
                              const steps = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
                              const currentIndex = steps.indexOf(selectedOrder.status);
                              const stepIndex = steps.indexOf(step);
                              const isActive = stepIndex <= currentIndex;

                              return (
                                <React.Fragment key={step}>
                                    <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#F87B1B] font-bold' : ''}`}>
                                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#F87B1B]' : 'bg-gray-300'}`}></div> 
                                        {step.replace('_', ' ')}
                                    </div>
                                    {idx < arr.length - 1 && <div className={`h-0.5 w-full mx-2 ${stepIndex < currentIndex ? 'bg-[#F87B1B]' : 'bg-gray-200'}`}></div>}
                                </React.Fragment>
                              )
                          })}
                      </div>
                    </div>

                    {/* Detail Customer & Alamat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Penerima</p>
                            <p className="text-sm font-bold text-gray-800">{selectedOrder.customer}</p>
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><Truck size={10}/> {selectedOrder.courier}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Alamat</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{selectedOrder.address}</p>
                        </div>
                    </div>

                    {/* List Item */}
                    <div>
                        <p className="text-sm font-bold text-gray-800 mb-3">Barang:</p>
                        <div className="space-y-3">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-lg">
                                    <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0">
                                        <img src={item.image} alt="" className="w-full h-full object-cover rounded-md"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-700 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.qty} x Rp {item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-sm font-bold text-[#F87B1B] whitespace-nowrap">
                                        Rp {(item.qty * item.price).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Logic Status Flow) */}
                <div className="p-4 md:p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
                    <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-bold w-full sm:w-auto">Tutup</button>
                    
                    {selectedOrder.status === 'PAID' && (
                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')} disabled={isUpdating} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 w-full sm:w-auto flex items-center justify-center gap-2">
                            {isUpdating ? <Loader2 className="animate-spin" size={16}/> : 'Konfirmasi Pesanan'}
                        </button>
                    )}
                    {selectedOrder.status === 'CONFIRMED' && (
                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PACKED')} disabled={isUpdating} className="px-6 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 w-full sm:w-auto flex items-center justify-center gap-2">
                            {isUpdating ? <Loader2 className="animate-spin" size={16}/> : 'Selesai Dikemas'}
                        </button>
                    )}
                    {selectedOrder.status === 'PACKED' && (
                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')} disabled={isUpdating} className="px-6 py-2 bg-[#F87B1B] text-white rounded-lg text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                            {isUpdating ? <Loader2 className="animate-spin" size={16}/> : <><Truck size={16}/> Request Pickup (Biteship)</>}
                        </button>
                    )}
                    {selectedOrder.status === 'SHIPPED' && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-4 py-2 rounded-lg">
                            <Truck size={16}/> Sedang Dikirim {selectedOrder.trackingId && `(Resi: ${selectedOrder.trackingId})`}
                        </div>
                    )}
                </div>

            </div>
        </div>
      )}
    </div>
  );
}