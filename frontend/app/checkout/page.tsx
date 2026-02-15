'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, Ticket, CreditCard, AlertCircle, CheckCircle, Loader2, Plus, X, Check } from 'lucide-react';
import { userService } from '@/services/userService'; 
import { useAuth } from '@/app/context/AuthContext';

const COURIERS = [
  { id: 'jne', name: 'JNE - Reguler', etd: '2-3 Hari', price: 18000 },
  { id: 'jnt', name: 'J&T - Express', etd: '1-2 Hari', price: 20000 },
  { id: 'sicepat', name: 'SiCepat - HALU', etd: '3-4 Hari', price: 15000 },
  { id: 'gosend', name: 'GoSend - Instant', etd: '1-3 Jam', price: 35000 },
];

const VOUCHERS = [
  { code: 'MANDES10', discount: 10000, minParams: 50000 },
  { code: 'ONGKIRFREE', discount: 15000, minParams: 100000 },
];

// WRAPPER COMPONENT
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]); 
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]); 
  const [selectedCourier, setSelectedCourier] = useState<typeof COURIERS[0] | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<typeof VOUCHERS[0] | null>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ 
    show: false, message: '', type: 'success' 
  });

  // --- LOGIKA BACA MODE ---
  const mode = searchParams.get('mode'); 
  const directProductId = searchParams.get('productId');
  const directQty = parseInt(searchParams.get('qty') || '1');
  const directVariant = searchParams.get('variant') || 'Standard';

  // Kalkulasi Total
  const subtotal = checkoutItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
  const shippingCost = selectedCourier ? selectedCourier.price : 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const totalPayment = subtotal + shippingCost - discountAmount;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchAddresses = useCallback(async () => {
    try {
      const addresses = await userService.getAddresses();
      if (Array.isArray(addresses)) {
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
            const savedId = localStorage.getItem('last_selected_address_id');
            const foundSaved = addresses.find((a: any) => a.id === savedId);
            if (foundSaved) setSelectedAddress(foundSaved);
            else setSelectedAddress(addresses.find((a: any) => a.isDefault) || addresses[0]);
        }
      }
    } catch (e) {
      console.error("Gagal load alamat", e);
    }
  }, []);

  // --- 1. FETCH CART (MODE BIASA) ---
  const fetchCartItems = useCallback(async () => {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';
        const res = await fetch(`${API_URL}/cart`, { credentials: 'include' });
        
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                showToast("Keranjang kosong, kembali ke belanja...", "error");
                setTimeout(() => router.push('/products'), 2000);
            } else {
                setCheckoutItems(data);
            }
        } else {
            console.error("Gagal load cart");
        }
    } catch (e) {
        console.error("Error fetching cart:", e);
        showToast("Gagal memuat item checkout", "error");
    } finally {
        setDataLoading(false);
    }
  }, [router]);

  // --- 2. FETCH ITEM TUNGGAL (MODE BELI LANGSUNG) - [FIX LOGIC HARGA] ---
  const fetchDirectItem = useCallback(async () => {
    if (!directProductId) return;

    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';
        const res = await fetch(`${API_URL}/products/${directProductId}`, { credentials: 'include' });
        
        if (res.ok) {
            const product = await res.json();
            
            // --- FIX START: LOGIKA PENENTUAN HARGA ---
            // Kita harus mencari harga dari varian yang dipilih, bukan cuma product.price
            let finalPrice = product.price || product.basePrice || 0;

            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                // Cari varian yang cocok dengan string directVariant (misal: "Original - 140gr")
                const matchedVariant = product.variants.find((v: any) => {
                    // Logic pencocokan: Cek apakah nama varian + ukuran cocok
                    const variantNameFull = v.size ? `${v.name} - ${v.size}` : v.name;
                    return variantNameFull === directVariant || v.name === directVariant;
                });

                if (matchedVariant) {
                    finalPrice = matchedVariant.price;
                }
            }
            // --- FIX END ---

            const directItem = [{
                productId: product.id,
                name: product.name,
                price: finalPrice, // Gunakan harga yang sudah difilter
                image: product.images?.[0] || null,
                quantity: directQty,
                variant: directVariant
            }];
            
            setCheckoutItems(directItem);
        } else {
            throw new Error("Produk tidak ditemukan");
        }
    } catch (e) {
        console.error("Error fetching direct item:", e);
        showToast("Gagal memuat produk", "error");
        setTimeout(() => router.push('/products'), 2000);
    } finally {
        setDataLoading(false);
    }
  }, [directProductId, directQty, directVariant, router]);

  // --- MAIN EFFECT ---
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
        showToast('Silakan login dulu', 'error');
        const returnUrl = encodeURIComponent(window.location.href);
        setTimeout(() => router.push(`/auth/login?callbackUrl=${returnUrl}`), 1500);
        return;
    }

    fetchAddresses();

    if (mode === 'direct' && directProductId) {
        fetchDirectItem();
    } else {
        fetchCartItems();
    }

  }, [authLoading, isAuthenticated, mode, directProductId, fetchCartItems, fetchDirectItem, fetchAddresses, router]);

  // --- HANDLERS LAIN ---
  const handleSelectAddress = (addr: any) => {
    setSelectedAddress(addr);
    localStorage.setItem('last_selected_address_id', addr.id);
    setIsAddressModalOpen(false);
    showToast('Alamat pengiriman dipilih', 'success');
  };

  const handleApplyVoucher = () => {
    const found = VOUCHERS.find(v => v.code === voucherCode);
    if (found && subtotal >= found.minParams) {
      setAppliedVoucher(found);
      showToast('Voucher berhasil digunakan!', 'success');
    } else {
      showToast('Kode voucher tidak valid', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return showToast('Pilih alamat pengiriman!', 'error');
    if (!selectedCourier) return showToast('Pilih kurir!', 'error');
    
    setIsProcessing(true);
    showToast('Memproses pesanan...', 'success');

    try {
        const payload = {
            addressId: selectedAddress.id,
            courier: selectedCourier.id,
            shippingCost: shippingCost,
            totalAmount: totalPayment,
            items: checkoutItems, 
            orderType: mode === 'direct' ? 'direct' : 'cart' 
        };

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");

        router.push(`/payment/${data.orderId}?token=${data.snap_token}`);

    } catch (error: any) {
        console.error("Order Error:", error);
        showToast(error.message, 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  if (authLoading || dataLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans relative">
      <header className="bg-white p-4 sticky top-0 z-40 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-[#F87B1B]"><ArrowLeft size={24}/></button>
        <h1 className="text-lg font-bold text-gray-800">
             {mode === 'direct' ? 'Beli Langsung' : 'Checkout Keranjang'}
        </h1>
      </header>

      {/* Toast Notification */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-gray-800 text-white border-gray-700' : 'bg-red-500 text-white border-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-green-400"/> : <AlertCircle size={20} className="text-white"/>}
            <span className="text-sm font-bold">{toast.message}</span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* ALAMAT */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#F87B1B]">
              <MapPin size={20} />
              <h2 className="font-bold text-sm">Alamat Pengiriman</h2>
            </div>
            {selectedAddress && (
              <button onClick={() => setIsAddressModalOpen(true)} className="text-xs font-bold text-gray-500 hover:text-[#F87B1B]">
                Ganti Alamat
              </button>
            )}
          </div>
          
          {selectedAddress ? (
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-orange-100 text-[#F87B1B] text-[10px] font-bold rounded-full uppercase">{selectedAddress.label}</span>
                <span className="font-bold text-gray-800 text-sm">{selectedAddress.recipient}</span>
                <span className="text-gray-500 text-xs">| {selectedAddress.phone}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{selectedAddress.fullAddress}</p>
              <p className="text-xs text-gray-500">{selectedAddress.city} {selectedAddress.postalCode}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
                <p className="text-xs text-red-500 text-center">Belum ada alamat yang dipilih.</p>
                <button onClick={() => router.push('/checkout/address')} className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-bold flex flex-col items-center justify-center gap-2 hover:border-[#F87B1B] hover:text-[#F87B1B] transition hover:bg-orange-50">
                <Plus size={24}/> Tambah Alamat Baru
                </button>
            </div>
          )}
        </section>

        {/* PRODUK (ITEM) */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           {checkoutItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Keranjang kosong</div>
           ) : (
               <div className="space-y-4">
                {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                        <img src={item.image || 'https://placehold.co/100'} className="w-16 h-16 rounded-lg bg-gray-100 object-cover" />
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">{item.name}</h3>
                            <p className="text-xs text-gray-500">{item.variant} • {item.quantity}x</p>
                            <p className="text-sm font-bold text-[#F87B1B] mt-1">
                              Rp {(item.price || 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                ))}
               </div>
           )}
        </section>

        {/* PENGIRIMAN */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><Truck size={18}/> Pengiriman</h2>
            <div className="space-y-2">
                {COURIERS.map((c) => (
                    <div key={c.id} onClick={() => setSelectedCourier(c)} className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer transition-all ${selectedCourier?.id === c.id ? 'border-[#F87B1B] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div><p className="text-sm font-bold">{c.name}</p><p className="text-xs text-gray-500">{c.etd}</p></div>
                        <span className="text-sm font-bold text-[#F87B1B]">Rp {c.price.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </section>

        {/* VOUCHER */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><Ticket size={18}/> Voucher Diskon</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Masukkan kode voucher" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#F87B1B] uppercase transition-all" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} />
            <button onClick={handleApplyVoucher} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition active:scale-95">Pakai</button>
          </div>
          {appliedVoucher && (
            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded flex justify-between items-center animate-in fade-in">
              <div className="flex items-center gap-1"><CheckCircle size={12}/> <span>Potongan {appliedVoucher.code}</span></div>
              <span className="font-bold">-Rp {appliedVoucher.discount.toLocaleString()}</span>
            </div>
          )}
        </section>

        {/* PEMBAYARAN */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><CreditCard size={18}/> Pembayaran</h2>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <p>Pembayaran akan diproses melalui <strong>Midtrans Payment Gateway</strong> setelah tombol "Buat Pesanan" ditekan.</p>
            </div>
        </section>

        {/* RINGKASAN */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rp {subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>Ongkir</span><span>Rp {shippingCost.toLocaleString()}</span></div>
          {discountAmount > 0 && (
             <div className="flex justify-between text-sm text-green-600 font-medium"><span>Total Diskon</span><span>-Rp {discountAmount.toLocaleString()}</span></div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t text-[#F87B1B]"><span>Total Pembayaran</span><span>Rp {totalPayment.toLocaleString()}</span></div>
        </section>
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 flex items-center justify-between gap-4 max-w-2xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total Bayar</span>
            <span className="text-lg font-extrabold text-[#F87B1B]">Rp {totalPayment.toLocaleString()}</span>
         </div>
         <button onClick={handlePlaceOrder} disabled={isProcessing || checkoutItems.length === 0} className="flex-1 bg-[#F87B1B] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Bayar Sekarang'}
         </button>
      </div>

      {/* Modal Alamat */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-800">Pilih Alamat Pengiriman</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition"><X size={24} className="text-gray-500"/></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><p>Belum ada alamat tersimpan.</p></div>
              ) : (
                savedAddresses.map((addr: any, idx: number) => (
                  <div key={idx} onClick={() => handleSelectAddress(addr)} className={`p-4 rounded-xl border-2 cursor-pointer transition relative group ${selectedAddress?.id === addr.id ? 'border-[#F87B1B] bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    {selectedAddress?.id === addr.id && <div className="absolute top-4 right-4 text-[#F87B1B]"><Check size={20}/></div>}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 rounded text-gray-600 uppercase">{addr.label}</span>
                        <h4 className="font-bold text-gray-800 text-sm">{addr.recipient}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{addr.phone}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{addr.fullAddress}, {addr.village}, {addr.district}, {addr.city} {addr.postalCode}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => router.push('/checkout/address')} className="w-full py-3 border border-[#F87B1B] text-[#F87B1B] rounded-xl font-bold text-sm hover:bg-orange-50 transition flex items-center justify-center gap-2 active:scale-95">
                <Plus size={18}/> Tambah Alamat Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}