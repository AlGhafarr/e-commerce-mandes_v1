'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Minus, Plus, Truck, Loader2, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { userService } from '@/services/userService';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mandessnack.shop';
const baseUrl = rawBaseUrl.replace(/\/$/, '');
const API_URL = `${baseUrl}/api/cart`;

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'orders') setActiveTab('orders');
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      if (!isAuthenticated) { setCartItems([]); setOrders([]); setLoading(false); return; }

      setLoading(true);
      try {
          if (activeTab === 'cart') {
            const res = await fetch(API_URL, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              const savedSelection = JSON.parse(sessionStorage.getItem('cart_selection') || '{}');
              if (Array.isArray(data)) {
                  setCartItems(data.map((item: any) => ({
                     ...item, price: item.price || 0,
                     selected: savedSelection[item.id] !== undefined ? savedSelection[item.id] : true
                  })));
              }
            }
          } else if (activeTab === 'orders') {
            const data = await userService.getOrders();
            setOrders(Array.isArray(data) ? data : []);
          }
      } catch (e) {
          console.error("Gagal load data", e);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, [activeTab, isAuthenticated, authLoading]);

  // --- CART HANDLERS (Sama seperti sebelumnya) ---
  const updateQuantity = async (item: CartItem, newQty: number) => {
     setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
     try {
         await fetch(`${API_URL}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: newQty }), credentials: 'include' });
     } catch(e) {}
  };
  const handleQuantity = (item: CartItem, type: 'inc' | 'dec') => {
    const newQty = type === 'inc' ? item.quantity + 1 : item.quantity - 1;
    if (newQty >= 1) updateQuantity(item, newQty);
  };
  const handleDelete = async (id: string | number) => {
    if (!confirm('Hapus item ini?')) return;
    setCartItems(prev => prev.filter(i => i.id !== id));
    try { await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' }); } catch (e) {}
  };
  const toggleSelect = (id: string | number) => {
    setCartItems(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item);
        sessionStorage.setItem('cart_selection', JSON.stringify(updated.reduce((acc, i) => ({...acc, [i.id]: i.selected}), {})));
        return updated;
    });
  };
  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(prev => {
        const updated = prev.map(item => ({ ...item, selected: !allSelected }));
        sessionStorage.setItem('cart_selection', JSON.stringify(updated.reduce((acc, i) => ({...acc, [i.id]: i.selected}), {})));
        return updated;
    });
  };
  const handleProceedToCheckout = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) return alert("Pilih minimal satu barang.");
    localStorage.setItem('checkout_items', JSON.stringify(selectedItems));
    router.push('/checkout');
  };

  const totalPrice = cartItems.reduce((total, item) => item.selected ? total + ((item.price || 0) * item.quantity) : total, 0);
  const totalSelectedItems = cartItems.filter(item => item.selected).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-md text-[10px] font-bold">Belum Bayar</span>;
      case 'PAID': return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-md text-[10px] font-bold">Lunas</span>;
      case 'SHIPPED': return <span className="bg-orange-50 text-[#F87B1B] border border-orange-200 px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><Truck size={12}/> Dikirim</span>;
      case 'DELIVERED': return <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Selesai</span>;
      default: return <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-md text-[10px] font-bold">{status || 'Proses'}</span>;
    }
  };

  // --- HELPER: Format Tanggal History ---
  const formatHistoryDate = (dateString: string) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

        {/* KERANJANG */}
        {!loading && activeTab === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400"><p>Keranjang kosong.</p><Link href="/products" className="text-[#F87B1B] font-bold mt-2 inline-block">Belanja Dulu</Link></div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3">
                  <div className="flex gap-3">
                    <input type="checkbox" checked={item.selected} onChange={() => toggleSelect(item.id)} className="w-5 h-5 accent-[#F87B1B] cursor-pointer self-center" />
                    <Link href={`/products/${item.productId}`} className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 block">
                      <img src={item.image || 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/products/${item.productId}`}>
                            <h3 className="font-bold text-gray-800 line-clamp-1 hover:text-[#F87B1B] transition-colors">{item.name}</h3>
                        </Link>
                        {item.variant && item.variant !== 'Standard' && (<p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit mt-1">{item.variant}</p>)}
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-[#F87B1B] font-bold">Rp {(item.price || 0).toLocaleString('id-ID')}</span>
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

        {/* PESANAN */}
        {!loading && activeTab === 'orders' && (
            <div className="space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><p>Belum ada riwayat pesanan.</p></div>
            ) : (
                orders.map((order: any) => {
                  let step = 0;
                  if (['PAID'].includes(order.status)) step = 1;
                  if (['CONFIRMED'].includes(order.status)) step = 2;
                  if (['SHIPPED'].includes(order.status)) step = 3;
                  if (['DELIVERED'].includes(order.status)) step = 4;
                  const stepsList = ['Dibayar', 'Dikemas', 'Dikirim', 'Diterima'];

                  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                  const invoiceId = order.id?.startsWith('INV') ? order.id : `INV/${new Date(order.createdAt || Date.now()).getFullYear()}/${String(order.id || 'N/A').slice(-5).toUpperCase()}`;

                  // ✅ PERHITUNGAN DINAMIS QTY BARANG
                  const firstItem = order.items?.[0];
                  const totalQty = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                  const extraItemsCount = order.items?.length > 1 ? order.items.length - 1 : 0;
                  
                  // ✅ AMBIL DATA TRACKING HISTORY DARI DB
                  const trackingHistory: any[] = typeof order.trackingHistory === 'string' 
                        ? JSON.parse(order.trackingHistory) 
                        : (order.trackingHistory || []);
                  
                  // Urutkan riwayat dari yang paling baru ke lama
                  const sortedHistory = [...trackingHistory].reverse();

                  return (
                    <div key={order.id || Math.random()} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                      
                      {/* HEADER */}
                      <div className="p-4 border-b border-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs text-gray-500">{orderDate}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm font-extrabold text-gray-800">{invoiceId}</p>
                      </div>

                      {/* STEPPER TRACKER */}
                      {order.status !== 'PENDING_PAYMENT' && order.status !== 'CANCELLED' && (
                        <div className="p-5 relative flex justify-between items-center bg-white">
                          <div className="absolute top-7 left-8 right-8 h-[2px] bg-orange-50 -z-10"></div>
                          {stepsList.map((s, i) => {
                            const isActive = step > i;
                            return (
                              <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`w-5 h-5 rounded-full border-[4px] flex items-center justify-center ${isActive ? 'bg-white border-[#F87B1B]' : 'bg-white border-orange-100'}`}>
                                  {isActive && <div className="w-2 h-2 bg-[#F87B1B] rounded-full"></div>}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'text-[#F87B1B] font-bold' : 'text-gray-400 font-medium'}`}>{s}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="px-4 pb-4 space-y-4">
                        {/* PRODUK BISA DIKLIK */}
                        <Link href={`/products/${firstItem?.productId || ''}`} className="flex gap-3 items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:border-[#F87B1B] transition-colors cursor-pointer group">
                          <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {firstItem?.product?.images?.[0] ? (
                                <img src={firstItem.product.images[0]} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                                <Package className="text-gray-400" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-[#F87B1B] transition-colors">
                                {firstItem?.productName || 'Produk Mandes Snack'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {totalQty} Barang
                            </p>
                            {extraItemsCount > 0 && (
                              <p className="text-[10px] text-gray-400 mt-0.5">+ {extraItemsCount} barang lainnya</p>
                            )}
                          </div>
                        </Link>

                        {/* ✅ TIMELINE RESI (PERSIS SEPERTI REFERENSI GAMBAR 1) */}
                        {order.resiNumber && (
                          <div className="bg-white rounded-xl pt-2">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck size={14} className="text-[#F87B1B]" />
                              <p className="text-xs font-bold text-gray-700">
                                  Update Pengiriman ({order.courier?.toUpperCase() || 'KURIR'} - {order.resiNumber})
                              </p>
                            </div>

                            <div className="ml-1.5 py-1">
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map((track, idx) => (
                                        <div key={idx} className={`relative pl-5 pb-4 ${idx !== sortedHistory.length - 1 ? 'border-l-2 border-[#F87B1B]' : ''}`}>
                                            {/* Lingkaran Titik Orange */}
                                            <div className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-[#F87B1B] border-2 border-white"></div>
                                            
                                            <p className={`text-xs leading-tight ${idx === 0 ? 'text-gray-800 font-bold' : 'text-gray-600'}`}>
                                                {track.note || 'Paket diperbarui'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {formatHistoryDate(track.updated_at || new Date().toISOString())}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative pl-5 border-l-2 border-[#F87B1B] pb-2">
                                        <div className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-[#F87B1B] border-2 border-white"></div>
                                        <p className="text-xs font-bold text-gray-800 leading-tight">Paket sedang diproses dan menunggu update dari kurir pengiriman.</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{orderDate}</p>
                                    </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* FOOTER */}
                      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">Total Harga ({totalQty} barang)</p>
                          <p className="text-sm font-bold text-[#F87B1B]">
                              Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        
                        {order.status === 'PENDING_PAYMENT' && order.snapToken ? (
                          <Link href={`/payment/${order.id}?token=${order.snapToken}`} className="px-6 py-2 bg-[#F87B1B] text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-transform">
                              Bayar
                          </Link>
                        ) : order.resiNumber ? (
                          <button className="px-6 py-2 bg-[#F87B1B] text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-transform">
                              Lacak
                          </button>
                        ) : order.status === 'DELIVERED' ? (
                          <button disabled className="px-6 py-2 border border-green-200 text-green-600 bg-green-50 text-xs font-bold rounded-lg">
                              Selesai
                          </button>
                        ) : (
                          <button disabled className="px-6 py-2 border border-gray-200 text-gray-400 text-xs font-bold rounded-lg bg-white">
                              Proses
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
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
                <p className="text-lg font-bold text-[#F87B1B]">Rp {(totalPrice || 0).toLocaleString('id-ID')}</p>
              </div>
              <button onClick={handleProceedToCheckout} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${totalSelectedItems > 0 ? 'bg-gradient-to-r from-[#F87B1B] to-[#FF9F4A]' : 'bg-gray-300 cursor-not-allowed'}`} disabled={totalSelectedItems === 0}>
                Checkout ({totalSelectedItems})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}