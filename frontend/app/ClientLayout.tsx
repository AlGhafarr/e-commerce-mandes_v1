'use client'; // Wajib ada di baris pertama

import React, { useEffect, useState } from 'react';
import { authEvents } from '@/utils/event';
import LoginModal from '@/components/LoginModal'; // Pastikan path benar

// Import Context Providers
import { AuthProvider } from '@/app/context/AuthContext';
import { UIProvider } from '@/app/context/UIContext';
import { ProductProvider } from '@/app/context/ProductContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Event Listener untuk membuka modal dari mana saja
    const cleanup = authEvents.onOpenLoginModal(() => {
      setShowLoginModal(true);
    });
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <UIProvider>
        <ProductProvider>
          
          {/* Skip to main content (Accessibility) */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#F87B1B] focus:text-white focus:rounded-lg">
            Skip to main content
          </a>

          {/* Main Content Area */}
          <div id="main-content">
            {children}
          </div>

          {/* Development Indicators */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono z-[100] pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                DEV MODE
              </div>
            </div>
          )}

          {/* GLOBAL LOGIN MODAL */}
          {showLoginModal && (
            <LoginModal 
              isOpen={showLoginModal} 
              onClose={() => setShowLoginModal(false)} 
            />
          )}

        </ProductProvider>
      </UIProvider>
    </AuthProvider>
  );
}