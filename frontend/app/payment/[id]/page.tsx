'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mandessnack.shop';
const baseUrl = rawBaseUrl.replace(/\/$/, '');
const API_URL = `${baseUrl}/api`;

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#F87B1B]" size={40}/></div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snapToken = searchParams.get('token'); 
  
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'success'>('waiting');

  // ✅ 1. Load Script Midtrans dari Backend API
  useEffect(() => {
    const fetchConfigAndLoadSnap = async () => {
      try {
        // Ambil konfigurasi dari Backend
        const res = await fetch(`${API_URL}/payment/config`);
        const config = await res.json();

        // Tentukan URL otomatis (Sandbox vs Live) berdasarkan respons backend
        const scriptUrl = config.isProduction 
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';

        // Buat tag script ke HTML
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.setAttribute('data-client-key', config.clientKey);
        script.async = true;

        script.onload = () => setIsSnapLoaded(true);
        document.body.appendChild(script);
      } catch (error) {
        console.error("Gagal memuat konfigurasi Midtrans:", error);
      }
    };

    fetchConfigAndLoadSnap();

    return () => {
      // Bersihkan script jika user pindah halaman
      const scripts = document.querySelectorAll(`script[src*="snap.js"]`);
      scripts.forEach(s => s.remove());
    };
  }, []);

  // 2. Fungsi Memunculkan Pop-Up Midtrans
  const handlePayWithMidtrans = () => {
    if (!snapToken) return alert("Token Midtrans tidak valid!");

    if ((window as any).snap) {
      (window as any).snap.pay(snapToken, {
        onSuccess: function (result: any) {
          setPaymentStatus('success');
          setTimeout(() => router.push('/cart?tab=orders'), 2000);
        },
        onPending: function (result: any) {
          alert("Silakan selesaikan pembayaran sesuai instruksi.");
          router.push('/cart?tab=orders');
        },
        onError: function (result: any) {
          alert("Pembayaran gagal atau dibatalkan!");
        },
        onClose: function () {
          console.log('Customer menutup popup tanpa menyelesaikan pembayaran');
        }
      });
    }
  };

  if (!snapToken) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 bg-gray-50 p-4 text-center">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="font-bold">Sesi Pembayaran Tidak Valid</p>
              <button onClick={() => router.push('/')} className="mt-4 text-[#F87B1B] underline font-bold">Kembali ke Beranda</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-40">
        <button onClick={() => router.push('/cart?tab=orders')}><ArrowLeft size={24} className="text-gray-600"/></button>
        <h1 className="text-lg font-bold text-gray-800">Pembayaran Aman</h1>
      </header>

      <main className="max-w-md mx-auto p-4 mt-8 space-y-6 text-center">
        {paymentStatus === 'success' ? (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                     <CheckCircle size={40}/>
                 </div>
                 <h2 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                 <p className="text-sm text-gray-500 mb-6 px-4">Terima kasih. Pesanan Anda akan segera kami proses.</p>
                 <Loader2 className="animate-spin text-[#F87B1B]" size={24} />
             </div>
        ) : (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-orange-100 text-[#F87B1B] rounded-full flex items-center justify-center mb-6">
                    <CreditCard size={40} />
                </div>
                
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Metode Pembayaran</h2>
                <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
                    Pesanan Anda telah diamankan. Silakan klik tombol di bawah untuk memilih metode pembayaran melalui sistem aman Midtrans.
                </p>

                <button 
                    onClick={handlePayWithMidtrans}
                    disabled={!isSnapLoaded}
                    className="w-full bg-[#F87B1B] text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                >
                    {!isSnapLoaded ? (
                        <><Loader2 className="animate-spin" size={24}/> Memuat Sistem...</>
                    ) : (
                        'Bayar Sekarang'
                    )}
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-1 text-xs text-gray-400 font-medium">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Pembayaran dijamin aman & terenkripsi</span>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}