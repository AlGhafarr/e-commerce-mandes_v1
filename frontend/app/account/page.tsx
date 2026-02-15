'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { userService } from '@/services/userService';
import { User, MapPin, Package, LogOut, Plus, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header'; // Pastikan path benar

export default function AccountPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  
  // Data States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Redirect jika belum login
  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  // Fetch Data saat tab berubah
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        if (activeTab === 'addresses') {
          const data = await userService.getAddresses();
          setAddresses(data);
        } else if (activeTab === 'orders') {
          const data = await userService.getOrders();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header /> {/* Opsional, jika ingin header standar */}
      
      <div className="container mx-auto px-4 pt-24 lg:pt-32">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Akun Saya</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* SIDEBAR MENU */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-lg">{user.name}</h2>
                <p className="text-xs opacity-90">@{user.username}</p>
              </div>
              <div className="p-2">
                <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition ${activeTab === 'profile' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <User size={18}/> Profil
                </button>
                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Package size={18}/> Pesanan Saya
                </button>
                <button onClick={() => setActiveTab('addresses')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition ${activeTab === 'addresses' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <MapPin size={18}/> Alamat Tersimpan
                </button>
                <hr className="my-2 border-gray-100"/>
                <button onClick={logout} className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium text-red-500 hover:bg-red-50 transition">
                  <LogOut size={18}/> Keluar
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:w-3/4">
            
            {/* 1. PROFIL TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Informasi Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Nama Lengkap</label>
                    <div className="font-medium text-gray-800">{user.name}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Username</label>
                    <div className="font-medium text-gray-800">@{user.username}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Status Akun</label>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Verified Member</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Riwayat Pesanan</h3>
                {loadingData ? <div className="text-center py-10 text-gray-400">Memuat pesanan...</div> : 
                 orders.length === 0 ? (
                   <div className="bg-white p-10 rounded-xl text-center text-gray-400">
                     <Package size={48} className="mx-auto mb-2 opacity-20"/>
                     <p>Belum ada pesanan.</p>
                   </div>
                 ) : (
                   orders.map((order: any) => (
                     <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 transition">
                       <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                         <div>
                           <p className="text-xs text-gray-500">No. Pesanan</p>
                           <p className="font-bold text-sm text-gray-800">{order.id}</p>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                           order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                           order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-700' :
                           'bg-gray-100 text-gray-600'
                         }`}>
                           {order.status.replace('_', ' ')}
                         </div>
                       </div>
                       <div className="space-y-2 mb-3">
                         {order.items.map((item: any) => (
                           <div key={item.id} className="flex justify-between text-sm">
                             <span className="text-gray-600">{item.quantity}x {item.productName} ({item.variantName})</span>
                             <span className="font-medium text-gray-800">Rp {item.totalPrice.toLocaleString()}</span>
                           </div>
                         ))}
                       </div>
                       <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                         <span className="text-xs text-gray-500">Total Belanja</span>
                         <span className="font-bold text-orange-600">Rp {order.totalAmount.toLocaleString()}</span>
                       </div>
                     </div>
                   ))
                 )}
              </div>
            )}

            {/* 3. ADDRESS TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">Alamat Tersimpan</h3>
                  <button onClick={() => router.push('/checkout/address')} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 transition flex items-center gap-1">
                    <Plus size={16}/> Tambah Baru
                  </button>
                </div>
                
                {loadingData ? <div className="text-center py-10 text-gray-400">Memuat alamat...</div> :
                 addresses.length === 0 ? (
                   <div className="bg-white p-10 rounded-xl text-center text-gray-400">
                     <Home size={48} className="mx-auto mb-2 opacity-20"/>
                     <p>Belum ada alamat tersimpan.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {addresses.map((addr: any) => (
                       <div key={addr.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                         {addr.isDefault && <span className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded">UTAMA</span>}
                         <div className="mb-2">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{addr.label}</span>
                           <h4 className="font-bold text-gray-800">{addr.recipient}</h4>
                           <p className="text-xs text-gray-500">{addr.phone}</p>
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed mb-3 h-16 overflow-hidden">{addr.fullAddress}</p>
                         <p className="text-xs text-gray-400">{addr.city}, {addr.district}, {addr.postalCode}</p>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}