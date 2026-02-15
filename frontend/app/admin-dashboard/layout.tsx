'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, Package, Settings, LogOut, ChevronRight, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { name: 'Pelanggan', icon: Users, path: '/admin-dashboard/customers' },
    { name: 'Pesanan', icon: ShoppingBag, path: '/admin-dashboard/orders' },
    { name: 'Produk', icon: Package, path: '/admin-dashboard/products' },
    { name: 'Pengaturan', icon: Settings, path: '/admin-dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY (Background Gelap saat menu terbuka) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#F87B1B] to-orange-400 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-lg font-bold text-gray-800">Admin Panel</span>
            </div>
            {/* Tombol Tutup di Mobile */}
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-red-500">
              <X size={24}/>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsSidebarOpen(false)} // Tutup menu saat link diklik di mobile
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-orange-50 text-[#F87B1B] shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-[#F87B1B]' : 'text-gray-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-gray-100">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition">
              <LogOut size={20} />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* TOMBOL PANAH FLOATING (Mobile Trigger) */}
        {/* Hanya muncul di mobile jika sidebar tertutup */}
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className={`
              lg:hidden fixed top-24 left-0 z-30 bg-[#F87B1B] text-white p-2 rounded-r-xl shadow-lg transition-transform duration-300 flex items-center justify-center
              ${isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
            `}
            style={{ width: '40px', height: '40px' }}
        >
            <ChevronRight size={24} />
        </button>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}