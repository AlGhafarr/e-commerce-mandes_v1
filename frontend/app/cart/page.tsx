'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Trash2, Minus, Plus, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { userService } from '@/services/userService';

// --- SETUP URL YANG BENAR ---
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mandessnack.shop';
const baseUrl = rawBaseUrl.replace(/\/$/, '');
const API_URL = `${baseUrl}/api/cart`; // Hasil pasti: https://api.mandessnack.shop/api/cart

// --- TIPE DATA ---
interface CartItem {
  id: string; 
  productId?: string;
  variantId?: string;
  storeName: string;
  name: string;
  variant: string; 
  price: number;   
  image: string;
  quantity: number;
  selected: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DATA KERANJANG ---
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
          setCartItems([]);
          setOrders([]);
          setLoading(false);
          return;
      }

      setLoading(true);
      
      try {
          if (activeTab === 'cart') {
            // ✅ MENGGUNAKAN API_URL YANG SUDAH DIPERBAIKI
            const res = await fetch(API_URL, { credentials: 'include' });
            
            if (res.ok) {
              const data = await res.json();
              
              const savedSelection = JSON.parse(sessionStorage.getItem('cart_selection') || '{}');
              
              const mappedData = data.map((item: any) => ({
                 ...item,
                 price: item.price || 0,
                 selected: savedSelection[item.id] !== undefined ? savedSelection[item.id] : true
              }));
              
              setCartItems(mappedData);
            }
          } else if (activeTab === 'orders') {
            const data = await userService.getOrders();
            setOrders(data);
          }
      } catch (e) {
          console.error("Gagal load data", e);
      } finally {
          setLoading(false);
      }
    };

    loadData();
  }, [activeTab, isAuthenticated, authLoading]);

  // --- 2. UPDATE QUANTITY ---
  const updateQuantity = async (item: CartItem, newQty: number) => {
     setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

     try {
         // ✅ MENGGUNAKAN API_URL YANG SUDAH DIPERBAIKI
         await fetch(`${API_URL}/sync`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
                 productId: item.productId, 
                 variantId: item.variantId, 
                 quantity: newQty 
             }),
             credentials: 'include'
         });
     } catch(e) { console.error("Sync quantity gagal", e); }
  };

  const handleQuantity = (item: CartItem, type: 'inc' | 'dec') => {
    const newQty = type === 'inc' ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) return;
    updateQuantity(item, newQty);
  };

  // --- 3. DELETE ITEM ---
  const handleDelete = async (id: string | number) => {
    if (!confirm('Hapus item ini?')) return;
    
    const prevItems = [...cartItems];
    setCartItems(prev => prev.filter(i => i.id !== id));
    
    try {
        // ✅ MENGGUNAKAN API_URL YANG SUDAH DIPERBAIKI
        const res = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE', 
            credentials: 'include' 
        });
        if(!res.ok) throw new Error("Gagal hapus");
    } catch (e) {
        alert("Gagal menghapus item.");
        setCartItems(prevItems); 
    }
  };

  // --- HANDLERS LAINNYA ---
  const toggleSelect = (id: string | number) => {
    setCartItems(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item);
        sessionStorage.setItem('cart_selection', JSON.stringify(
            updated.reduce((acc, i) => ({...acc, [i.id]: i.selected}), {})
        ));
        return updated;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(prev => {
        const updated = prev.map(item => ({ ...item, selected: !allSelected }));
        sessionStorage.setItem('cart_selection', JSON.stringify(
            updated.reduce((acc, i) => ({...acc, [i.id]: i.selected}), {})
        ));
        return updated;
    });
  };

  const handleProceedToCheckout = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
        alert("Pilih minimal satu barang untuk dibeli.");
        return;
    }
    localStorage.setItem('checkout_items', JSON.stringify(selectedItems));
    router.push('/checkout');
  };

  const totalPrice = cartItems.reduce((total, item) => item.selected ? total + ((item.price || 0) * item.quantity) : total, 0);
  const totalSelectedItems = cartItems.filter(item => item.selected).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Belum Bayar</span>;
      case 'PAID': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Lunas</span>;
      case 'SHIPPED': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Truck size={12}/> Dikirim</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10 font-sans">
      <header className="bg-white sticky top-0 z-50 shadow-sm px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft className="text-gray-700" size={24} /></Link>
            <h1 className="text-xl font-bold text-gray-800">Pesanan</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex gap-4 mb-6 bg-white p-1 rounded-xl border border-gray-100 shadow-sm sticky top-20 z-40">
          <button onClick={() => setActiveTab('cart')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'cart' ? 'bg-[#F87B1B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Keranjang Saya</button>
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-[#F87B1B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Pesanan Saya</button>
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#F87B1B]" size={32} /></div>}

        {!loading && activeTab === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p>Keranjang kosong.</p>
                <Link href="/products" className="text-[#F87B1B] font-bold mt-2 inline-block">Belanja Dulu</Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 mb-3">
                  <div className="flex gap-3">
                    <input type="checkbox" checked={item.selected} onChange={() => toggleSelect(item.id)} className="w-5 h-5 accent-[#F87B1B] cursor-pointer self-center" />
                    
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image || 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                        
                        {item.variant && item.variant !== 'Standard' && (
                            <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit mt-1">
                                {item.variant}
                            </p>
                        )}
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-[#F87B1B] font-bold">
                            Rp {(item.price || 0).toLocaleString('id-ID')}
                        </span>
                        
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1 gap-3">
                          <button onClick={() => handleQuantity(item, 'dec')} disabled={item.quantity <= 1} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-600 shadow-sm disabled:opacity-50"><Minus size={14} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleQuantity(item, 'inc')} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-[#F87B1B] shadow-sm"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 flex items-center gap-1 font-medium hover:underline"><Trash2 size={14} /> Hapus</button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {!loading && activeTab === 'orders' && (
              <div className="space-y-4">
              {orders.length === 0 ? (
                  <div className="text-center py-10 text-gray-400"><p>Belum ada riwayat pesanan.</p></div>
              ) : (
                  orders.map((order: any) => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                          <p className="text-xs font-mono font-bold text-gray-800">#{order.id.slice(-8)}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="p-4 flex justify-between items-center bg-white">
                        <p className="text-sm font-bold text-[#F87B1B]">Total: Rp {order.totalAmount.toLocaleString()}</p>
                        {order.status === 'PENDING_PAYMENT' && (
                            <Link href={`/payment/${order.id}?token=${order.snapToken}`} className="px-4 py-2 bg-[#F87B1B] text-white text-xs font-bold rounded-lg">Bayar</Link>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
        )}
      </main>

      {!loading && activeTab === 'cart' && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={cartItems.length > 0 && cartItems.every(i => i.selected)} onChange={toggleSelectAll} className="w-5 h-5 accent-[#F87B1B] cursor-pointer" />
              <label className="text-sm text-gray-600 cursor-pointer select-none">Semua</label>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Harga</p>
                <p className="text-lg font-bold text-[#F87B1B]">Rp {totalPrice.toLocaleString('id-ID')}</p>
              </div>
              <button 
                onClick={handleProceedToCheckout} 
                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${totalSelectedItems > 0 ? 'bg-gradient-to-r from-[#F87B1B] to-[#FF9F4A]' : 'bg-gray-300 cursor-not-allowed'}`}
                disabled={totalSelectedItems === 0}
              >
                Checkout ({totalSelectedItems})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}