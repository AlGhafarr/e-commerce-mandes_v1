'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, X, FileSpreadsheet, Database, Check, AlertTriangle, Loader2 } from 'lucide-react';

// --- INTERFACES ---
interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface OrderHistory {
  order_id: string;
  date: string;
  total: number;
  payment_method: string; 
  status: string; 
  items: OrderItem[];
}

interface Customer {
  id: string; 
  phone: string;
  name: string;
  last_login: string;
  created_at: string;
  orders: OrderHistory[]; 
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ 
    show: false, message: '', type: 'success' 
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- FETCH DATA DARI API DATABASE ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Gunakan Env Variable agar dinamis, atau fallback ke localhost
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';
        
        const res = await fetch(`${API_BASE}/admin/customers`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // PENTING: Kirim cookie token admin
        });

        if (!res.ok) throw new Error("Gagal mengambil data dari server");

        const data = await res.json();
        
        // Mapping data dari Backend ke Interface UI (Format Tanggal dll)
        const mappedData = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            last_login: new Date(c.joinedAt || c.created_at).toLocaleDateString('id-ID'), // Fallback date
            created_at: new Date(c.created_at || c.joinedAt).toLocaleDateString('id-ID'),
            orders: c.orders.map((o: any) => ({
                order_id: o.order_id,
                date: new Date(o.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}),
                total: o.total,
                payment_method: o.payment_method,
                status: o.status,
                items: o.items
            }))
        }));

        setCustomers(mappedData);
      } catch (error) {
        console.error(error);
        showToast("Gagal terhubung ke server database", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = () => {
    showToast("Fitur export belum diimplementasikan di backend", "info");
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="relative w-full max-w-[100vw]">
      
      {/* TOAST */}
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border-l-4 bg-white ${
            toast.type === 'success' ? 'border-green-500' : 
            toast.type === 'error' ? 'border-red-500' : 
            'border-blue-500'
        }`}>
            <div className={`p-2 rounded-full ${
                toast.type === 'success' ? 'bg-green-100 text-green-600' : 
                toast.type === 'error' ? 'bg-red-100 text-red-600' : 
                'bg-blue-100 text-blue-600'
            }`}>
               {toast.type === 'success' ? <Check size={18}/> : <AlertTriangle size={18}/>}
            </div>
            <div>
               <h4 className="text-sm font-bold text-gray-800">
                 {toast.type === 'success' ? 'Sukses' : toast.type === 'error' ? 'Gagal' : 'Info'}
               </h4>
               <p className="text-xs text-gray-500">{toast.message}</p>
            </div>
            <button onClick={() => setToast(prev => ({...prev, show: false}))} className="ml-4 text-gray-400 hover:text-gray-600"><X size={16}/></button>
        </div>
      </div>

      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Database Pelanggan</h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Database size={12}/> Live Data PostgreSQL
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama / No. WA..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#F87B1B] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition active:scale-95"
          >
            <FileSpreadsheet size={18}/> <span>Export Excel</span>
          </button>
        </div>
      </div>
      
      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-4">No. WhatsApp</th>
                <th className="p-4">Nama Profil</th>
                <th className="p-4">Total Order</th>
                <th className="p-4">Terakhir Login</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                        <Loader2 className="animate-spin" size={20}/> Memuat Data Pelanggan...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-blue-600 font-medium">{cust.phone}</td>
                    <td className="p-4 font-bold text-gray-700">
                      {cust.name}
                      <div className="text-[10px] text-gray-400 font-normal">Gabung: {cust.created_at}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${cust.orders.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cust.orders.length} Transaksi
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{cust.last_login}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedCustomer(cust)}
                        className="text-xs font-bold text-[#F87B1B] hover:text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition hover:bg-orange-50"
                      >
                        <Eye size={14}/> <span className="hidden sm:inline">Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Data tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL (Tidak ada perubahan UI) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Riwayat Pesanan</h2>
                <p className="text-xs md:text-sm text-gray-500 line-clamp-1">{selectedCustomer.name} | {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
                <X size={24} className="text-gray-500"/>
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto bg-gray-50/50">
              {selectedCustomer.orders.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                  <p>Belum ada riwayat transaksi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomer.orders.map((order, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 border-b border-gray-100 pb-3 gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400">ORDER ID</span>
                          <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-1 rounded truncate max-w-[150px]" title={order.order_id}>
                             #{order.order_id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-gray-500 block">{order.date}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold inline-block mt-1 ${
                              order.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                              order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                              {order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.qty}x {item.name}</span>
                            <span className="text-gray-500">Rp {item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">{order.payment_method}</span>
                        <span className="text-sm font-bold text-[#F87B1B]">Rp {order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white text-right">
              <button onClick={() => setSelectedCustomer(null)} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold w-full sm:w-auto">Tutup</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}