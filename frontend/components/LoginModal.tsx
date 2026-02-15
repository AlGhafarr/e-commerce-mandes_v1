'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, LogIn, KeyRound, AtSign } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

export default function LoginModal({ isOpen, onClose, initialView = 'login' }: LoginModalProps) {
  const { login, registerRequest, verifyOtp, setPassword } = useAuth();
  
  // State Flow: login, register_init, register_otp, register_pass
  const [view, setView] = useState<'login' | 'register_init' | 'register_otp' | 'register_pass'>('login');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(0); // Timer OTP
  
  // Form Data
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    phone: '', 
    password: '', 
    otp: '' 
  });

  // Reset saat modal dibuka/tutup atau ganti initialView
  useEffect(() => {
    if (isOpen) {
        setView(initialView === 'register' ? 'register_init' : 'login');
        setErrorMsg("");
        setFormData(prev => ({...prev, password: '', otp: ''})); // Clear sensitive data
    }
  }, [isOpen, initialView]);

  // Countdown Timer untuk OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'register_otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [view, countdown]);

  if (!isOpen) return null;

  // --- HANDLERS ---

  // 1. LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg("");
    try {
      // username field disini dipake buat identifier (bisa email atau username)
      await login(formData.username, formData.password); 
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Username/Email atau Password salah.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. REGISTER: INIT (Kirim Data Awal)
  const handleRegInit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Sederhana
    if (formData.phone.length < 10) return setErrorMsg("Nomor WhatsApp tidak valid.");
    if (!formData.username) return setErrorMsg("Username wajib diisi.");

    setIsLoading(true); setErrorMsg("");
    try {
      await registerRequest(formData);
      setView('register_otp');
      setCountdown(300); // 5 Menit countdown
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses pendaftaran. Username/No HP mungkin sudah dipakai.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. REGISTER: VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg("");
    try {
      await verifyOtp(formData.username, formData.otp);
      setView('register_pass');
    } catch (err: any) {
      setErrorMsg("Kode OTP salah atau kadaluarsa!");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. REGISTER: SET PASSWORD (FINISH)
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) return setErrorMsg("Password minimal 6 karakter.");

    setIsLoading(true); setErrorMsg("");
    try {
      await setPassword(formData.username, formData.password);
      
      // Auto switch ke login dan isi form
      alert("Registrasi Berhasil! Silakan Login dengan password baru Anda.");
      setView('login');
      setFormData(prev => ({ ...prev, password: '' })); // Kosongkan password biar user ketik ulang
    } catch (err: any) {
      setErrorMsg("Gagal menyimpan password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper untuk switch mode login/register di awal
  const switchMode = (mode: 'login' | 'register') => {
      setView(mode === 'register' ? 'register_init' : 'login');
      setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95">
        
        {/* Tombol Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X size={24}/></button>

        <div className="p-8">
          
          {/* HEADER DINAMIS */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {view === 'login' && 'Selamat Datang'}
              {view === 'register_init' && 'Daftar Akun Baru'}
              {view === 'register_otp' && 'Verifikasi WhatsApp'}
              {view === 'register_pass' && 'Buat Password'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {view === 'login' && 'Masuk untuk mengakses keranjang & promo.'}
              {view === 'register_init' && 'Lengkapi data diri untuk membuat akun.'}
              {view === 'register_otp' && `Kode dikirim ke +${formData.phone}`}
              {view === 'register_pass' && 'Amankan akun Anda dengan password.'}
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="flex-shrink-0"/> <span>{errorMsg}</span>
            </div>
          )}

          {/* --- VIEW 1: LOGIN --- */}
          {view === 'login' && (
            <>
                {/* Tabs Kecil */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button onClick={() => switchMode('register')} className="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-700 transition">Daftar</button>
                    <button onClick={() => switchMode('login')} className="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-[#F87B1B] shadow-sm transition">Masuk</button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Username / Email</label>
                    <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                    <input type="text" required placeholder="Masukkan username atau email" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#F87B1B] text-sm transition"
                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Password</label>
                    <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                    <input type="password" required placeholder="******" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#F87B1B] text-sm transition"
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-[#F87B1B] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex justify-center items-center gap-2 shadow-lg shadow-orange-200">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><LogIn size={18}/> Masuk Sekarang</>}
                </button>
                </form>
            </>
          )}

          {/* --- VIEW 2: REGISTER INIT --- */}
          {view === 'register_init' && (
            <>
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button onClick={() => switchMode('register')} className="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-[#F87B1B] shadow-sm transition">Daftar</button>
                    <button onClick={() => switchMode('login')} className="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 hover:text-gray-700 transition">Masuk</button>
                </div>

                <form onSubmit={handleRegInit} className="space-y-3">
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="text" required placeholder="Nama Lengkap" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F87B1B]"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="relative">
                    <AtSign className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="text" required placeholder="Username (Unik)" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F87B1B]"
                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} />
                </div>

                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="email" placeholder="Email (Opsional)" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F87B1B]"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="tel" required placeholder="WhatsApp (08...)" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F87B1B]"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} />
                </div>
                
                <button type="submit" disabled={isLoading} className="w-full bg-[#F87B1B] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex justify-center items-center gap-2 shadow-lg shadow-orange-200 mt-2">
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><KeyRound size={18}/> Kirim Token WhatsApp</>}
                </button>
                </form>
            </>
          )}

          {/* --- VIEW 3: REGISTER OTP --- */}
          {view === 'register_otp' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 text-[#F87B1B] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <KeyRound size={32} />
              </div>
    
              <h3 className="font-bold text-gray-800">Masukkan Token</h3>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Kode dikirim ke <span className="font-bold">+{formData.phone}</span><br/>
                (Cek Terminal Backend jika WA tidak masuk)
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {/* UPDATE DISINI: MaxLength 6 dan Lebar Input */}
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    placeholder="000000" 
                    autoFocus
                    className="w-56 text-center text-3xl tracking-[0.5em] font-bold border-b-2 border-gray-300 focus:border-[#F87B1B] outline-none py-2 bg-transparent transition"
                    value={formData.otp} 
                    onChange={e => setFormData({...formData, otp: e.target.value.replace(/\D/g,'')})}
                  />
                </div>
      
                <div className="flex justify-between items-center text-xs px-4">
                  <span className={countdown < 60 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                      Sisa waktu: {Math.floor(countdown/60)}:{countdown%60 < 10 ? '0' : ''}{countdown%60}
                  </span>
                  {countdown === 0 && (
                      <button type="button" onClick={handleRegInit} className="text-[#F87B1B] font-bold hover:underline">
                      Kirim Ulang
                      </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  // UPDATE DISINI: Validasi panjang 6
                  disabled={isLoading || formData.otp.length < 6} 
                  className="w-full bg-[#F87B1B] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><ArrowRight size={20}/> Verifikasi Token</>}
                </button>
              </form>
              <button onClick={() => setView('register_init')} className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline">Ganti Nomor / Username</button>
            </div>
          )}
          {/* --- VIEW 4: REGISTER PASSWORD --- */}
          {view === 'register_pass' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Buat Password Baru</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                    <input type="password" required minLength={6} placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#F87B1B] text-sm transition"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex justify-center gap-2 items-center shadow-lg shadow-green-200 mt-4">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle size={18}/> Selesai & Masuk</>}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}