'use client';

import React from 'react';
import Link from 'next/link';
import { X, ChevronRight, Home, Grid, Tag, Phone, User, ShoppingCart } from 'lucide-react';

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navbar({ isOpen, onClose }: NavbarProps) {
  return (
    <>
      {/* Backdrop: Z-Index 100 */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        onClick={onClose}
      />

      {/* Sidebar: Z-Index 110 (Paling Atas) */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[110] shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#F87B1B]">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">SN</div>
             <span className="font-bold text-white text-lg">Menu Utama</span>
          </div>
          <button onClick={onClose} className="p-1 text-white hover:bg-white/20 rounded-full transition"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {[
            { name: 'Beranda', icon: Home, link: '/' },
            { name: 'Produk', icon: Grid, link: '/products' },
            { name: 'Promo', icon: Tag, link: '/promo' },
            { name: 'Keranjang', icon: ShoppingCart, link: '/cart' },
            { name: 'Akun Saya', icon: User, link: '/prof' },
            { name: 'Hubungi Kami', icon: Phone, link: '/contact' },
          ].map((item, idx) => (
            <Link key={idx} href={item.link} onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-[#F87B1B] transition group border border-transparent hover:border-orange-100">
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-gray-400 group-hover:text-[#F87B1B] transition"/>
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#F87B1B]"/>
            </Link>
          ))}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-center text-gray-400">© 2026 Mandes Snack App</p>
        </div>
      </div>
    </>
  );
}