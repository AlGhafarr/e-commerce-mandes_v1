'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Copy, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCopied, setIsCopied] = useState(''); // Untuk feedback tombol copy

  // Load Data Transaksi
  useEffect(() => {
    const data = localStorage.getItem('current_transaction');
    if (data) {
      setTransaction(JSON.parse(data));
    } else {
      // Jika tidak ada data transaksi, kembalik ke home
      router.push('/');
    }
  }, [router]);

  // Timer Mundur
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handler Copy Text
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(type);
    setTimeout(() => setIsCopied(''), 2000);
  };

  // Handler Simulasi Pembayaran Berhasil
  const handleCheckPayment = () => {
    setIsChecking(true);
    // Simulasi delay cek server midtrans
    setTimeout(() => {
        setIsChecking(false);
        setShowSuccessModal(true);
        
        // Simpan ke riwayat pesanan (Simulasi Database Update)
        const currentHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
        const newOrder = {
            ...transaction,
            status: 'paid', // Update status jadi Paid
            statusLabel: 'Dikemas'
        };
        localStorage.setItem('order_history', JSON.stringify([newOrder, ...currentHistory]));
        
        // Hapus transaksi sementara
        localStorage.removeItem('current_transaction');
    }, 2000);
  };

  if (!transaction) return null;

  // Generate Nomor VA Dummy berdasarkan Order ID
  const vaNumber = transaction.method.id === 'bca' ? `8800${transaction.id.replace(/\D/g,'')}` : 
                   transaction.method.id === 'mandiri' ? `900${transaction.id.replace(/\D/g,'')}` : 
                   null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-40">
        <button onClick={() => router.back()}><ArrowLeft size={24} className="text-gray-600"/></button>
        <h1 className="text-lg font-bold text-gray-800">Menunggu Pembayaran</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        
        {/* TIMER & TOTAL */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
                <Clock size={18}/>
                <span className="font-bold text-sm">
                    Selesaikan dalam {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}:{String(timeLeft.seconds).padStart(2,'0')}
                </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Pembayaran</p>
            <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">Rp {transaction.total.toLocaleString('id-ID')}</h2>
                <button onClick={() => handleCopy(transaction.total.toString(), 'total')} className="text-gray-400 hover:text-[#F87B1B]">
                    {isCopied === 'total' ? <CheckCircle size={16} className="text-green-500"/> : <Copy size={16}/>}
                </button>
            </div>
            <div className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full inline-block">
                Order ID: #{transaction.id}
            </div>
        </div>

        {/* METODE PEMBAYARAN */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">{transaction.method.name}</span>
                <span className="text-2xl">{transaction.method.icon}</span>
            </div>

            {/* KONDISI TAMPILAN BERDASARKAN METODE */}
            <div className="p-6 flex flex-col items-center">
                
                {/* JIKA TRANSFER BANK (VA) */}
                {(transaction.method.id === 'bca' || transaction.method.id === 'mandiri') && (
                    <>
                        <p className="text-xs text-gray-500 mb-2">Nomor Virtual Account</p>
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl w-full justify-between mb-4 border border-gray-200">
                            <span className="text-xl font-mono font-bold text-[#F87B1B] tracking-widest">{vaNumber}</span>
                            <button onClick={() => handleCopy(vaNumber || '', 'va')} className="text-sm font-bold text-gray-500 hover:text-[#F87B1B] flex items-center gap-1">
                                {isCopied === 'va' ? <span className="text-green-500">Disalin!</span> : 'Salin'} <Copy size={16}/>
                            </button>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-start gap-2 text-left w-full">
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5"/>
                            <p>Proses verifikasi otomatis. Tidak perlu kirim bukti transfer.</p>
                        </div>
                    </>
                )}

                {/* JIKA QRIS / E-WALLET */}
                {(transaction.method.id === 'qris' || transaction.method.id === 'gopay') && (
                    <div className="text-center w-full">
                        <p className="text-xs text-gray-500 mb-4">Scan QR Code ini menggunakan GoPay, OVO, Dana, atau ShopeePay</p>
                        <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl inline-block mb-4">
                            {/* Placeholder QR Code */}
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${transaction.id}`} alt="QR Code" className="w-48 h-48 opacity-90"/>
                        </div>
                        <button className="text-sm font-bold text-[#F87B1B] underline">Unduh QR Code</button>
                    </div>
                )}

            </div>
        </div>

        {/* INSTRUKSI PEMBAYARAN (ACCORDION) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-sm text-gray-800 mb-3">Cara Pembayaran</h3>
            <div className="space-y-3">
                <details className="group">
                    <summary className="flex justify-between items-center text-xs font-medium cursor-pointer list-none text-gray-600 hover:text-[#F87B1B]">
                        <span>Melalui ATM</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition"/>
                    </summary>
                    <div className="text-[11px] text-gray-500 mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
                        <p>1. Masukkan kartu ATM dan PIN.</p>
                        <p>2. Pilih menu Transaksi Lainnya {'>'} Transfer {'>'} Virtual Account.</p>
                        <p>3. Masukkan nomor VA: <span className="font-bold">{vaNumber}</span>.</p>
                        <p>4. Masukkan jumlah pembayaran sesuai total tagihan.</p>
                        <p>5. Ikuti instruksi selanjutnya hingga selesai.</p>
                    </div>
                </details>
                <details className="group">
                    <summary className="flex justify-between items-center text-xs font-medium cursor-pointer list-none text-gray-600 hover:text-[#F87B1B]">
                        <span>Melalui Mobile Banking (M-Banking)</span>
                        <ChevronDown size={14} className="group-open:rotate-180 transition"/>
                    </summary>
                    <div className="text-[11px] text-gray-500 mt-2 pl-2 border-l-2 border-gray-100 space-y-1">
                        <p>1. Login ke aplikasi M-Banking Anda.</p>
                        <p>2. Pilih menu m-Transfer {'>'} BCA Virtual Account.</p>
                        <p>3. Masukkan nomor VA: <span className="font-bold">{vaNumber}</span>.</p>
                        <p>4. Konfirmasi pembayaran.</p>
                    </div>
                </details>
            </div>
        </div>

      </main>

      {/* BOTTOM ACTION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto">
            <button 
                onClick={handleCheckPayment}
                disabled={isChecking}
                className="w-full bg-[#F87B1B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {isChecking ? 'Mengecek Status...' : 'Saya Sudah Bayar'}
            </button>
            <button onClick={() => router.push('/')} className="w-full mt-3 text-xs text-gray-400 font-bold hover:text-gray-600">
                Bayar Nanti (Kembali ke Beranda)
            </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle size={40}/>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-xs text-gray-500 mb-6">Terima kasih, pesanan Anda <b>#{transaction.id}</b> sedang diproses oleh penjual.</p>
                <button 
                    onClick={() => router.push('/cart?tab=orders')} 
                    className="w-full bg-[#F87B1B] text-white py-3 rounded-xl font-bold shadow-md hover:bg-orange-600"
                >
                    Lihat Status Pesanan
                </button>
            </div>
        </div>
      )}

    </div>
  );
}