'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedLink from '@/components/ProtectedLink'; // Link yang sudah diproteksi
import { useRouter } from 'next/navigation'; 
import { User, MapPin, Search, MessageCircle, Menu, ShoppingCart, X, Loader2 } from 'lucide-react';
import { useUI } from '@/app/context/UIContext';
import { useAuth } from '@/app/context/AuthContext'; 
import Navbar from './Navbar'; 

// IMPORT EVENT UTILS AGAR BISA PANGGIL MODAL GLOBAL
import { authEvents } from '@/utils/event'; 

export default function Header() {
  const { config } = useUI();
  const { user, isAuthenticated, isLoading } = useAuth(); 
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // KITA HAPUS STATE LOKAL 'isLoginOpen' KARENA SUDAH ADA DI GLOBAL LAYOUT

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- HANDLER TOMBOL USER (PENTING) ---
  const handleUserClick = () => {
    if (isLoading) return; // Cegah klik saat loading session

    if (isAuthenticated) {
      // Jika sudah login -> Masuk ke Akun
      router.push('/account');
    } else {
      // Jika belum login -> PANGGIL EVENT GLOBAL
      // Ini akan men-trigger modal yang ada di ClientLayout.tsx
      console.log("Triggering Global Login Modal from Header");
      authEvents.triggerLoginModal();
    }
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' 
            : 'bg-[#FCF9EA] py-3 lg:py-4'
        }`}
      >
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between">
            
            {/* --- KIRI: Search Bar & Menu --- */}
            <div className="flex-1 flex items-center justify-start gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-2 text-gray-700 hover:bg-orange-50 rounded-full transition"
              >
                <Menu size={24} />
              </button>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className="lg:hidden p-2 text-gray-700 hover:bg-orange-50 rounded-full transition"
              >
                <Search size={22} />
              </button>

              <div className="hidden lg:flex w-full max-w-xs items-center bg-white border border-gray-200 rounded-full px-4 py-2 focus-within:border-[#F87B1B] focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm">
                <Search size={18} className="text-gray-400 mr-2"/>
                <input type="text" placeholder="Cari cemilan..." className="bg-transparent w-full text-sm outline-none text-gray-700" />
              </div>
            </div>

            {/* --- TENGAH: Logo (Tetap Public) --- */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center">
              <Link href="/" className="flex items-center gap-2 group">
                {config.logo ? (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white transition-transform group-hover:scale-105">
                    <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#F87B1B] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                    SN
                  </div>
                )}
              </Link>
            </div>

            {/* --- KANAN: Icons --- */}
            <div className="flex-1 flex items-center justify-end gap-3 lg:gap-6">
              
              <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-gray-600">
                <Link href="/" className="hover:text-[#F87B1B] transition hover:-translate-y-0.5">Beranda</Link>
                {/* Protected Link akan otomatis trigger modal jika diklik guest */}
                <ProtectedLink href="/products" className="hover:text-[#F87B1B] transition hover:-translate-y-0.5">Produk</ProtectedLink>
                <ProtectedLink href="/promo" className="hover:text-[#F87B1B] transition hover:-translate-y-0.5">Promo</ProtectedLink>
              </nav>

              <div className="hidden lg:block h-6 w-px bg-gray-200"></div>

              <div className="flex items-center gap-2 lg:gap-3">
                <button className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-[#F87B1B] font-medium text-sm transition hover:bg-orange-50 px-3 py-2 rounded-lg">
                  <MapPin size={18}/> <span className="hidden xl:inline">Lokasi</span>
                </button>
                
                {/* --- TOMBOL USER --- */}
                {/* Tombol ini sekarang menggunakan handleUserClick yang memanggil authEvents */}
                <button 
                  onClick={handleUserClick}
                  className={`hidden lg:flex items-center gap-2 font-medium text-sm transition px-3 py-2 rounded-lg ${isAuthenticated ? 'text-[#F87B1B] bg-orange-50' : 'text-gray-600 hover:bg-orange-50 hover:text-[#F87B1B]'}`}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin"/>
                  ) : (
                    <>
                      <User size={18}/> 
                      <span className="hidden xl:inline max-w-[100px] truncate">
                        {isAuthenticated && user ? `Hi, ${user.username}` : 'Masuk'}
                      </span>
                    </>
                  )}
                </button>

                {/* --- CART ICON --- */}
                <ProtectedLink href="/cart" className="hidden lg:flex items-center justify-center bg-gray-100 text-gray-600 p-2.5 rounded-full hover:bg-orange-100 hover:text-[#F87B1B] transition active:scale-95 relative group">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">2</span>
                </ProtectedLink>

                <button className="bg-[#F87B1B] text-white p-2 lg:p-2.5 rounded-full hover:bg-orange-600 shadow-lg shadow-orange-200 transition active:scale-95">
                  <MessageCircle size={20} className="hidden lg:block"/>
                  <ShoppingCart size={20} className="lg:hidden"/> 
                </button>
              </div>

            </div>

          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 p-4 bg-white shadow-md border-t border-gray-100 animate-in slide-in-from-top-2 z-40">
              <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
                <Search size={18} className="text-gray-500 mr-2"/>
                <input autoFocus type="text" placeholder="Cari produk..." className="bg-transparent w-full text-sm outline-none" />
                <button onClick={() => setIsSearchOpen(false)}><X size={18} className="text-gray-400"/></button>
              </div>
            </div>
          )}
        </div>
      </header>

      <Navbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* TIDAK ADA LAGI <AuthModal /> DI SINI KARENA SUDAH ADA DI GLOBAL LAYOUT */}
    </>
  );
}