'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HomePageConfig {
  logo: string | null;
  hero: {
    title: string;
    subtitle: string;
    // Hapus 'animation' lama (popcorn/chips), ganti dengan 'media'
    media: string | null; // URL atau Base64 Image/Gif
  };
  about: {
    title: string;
    description: string;
  };
  featuredProductIds: number[];
  sectionOrder: string[]; 
}

const DEFAULT_CONFIG: HomePageConfig = {
  logo: null,
  hero: {
    title: 'Cemilan Lezat Untuk Keluarga',
    subtitle: 'Nikmati berbagai pilihan snack berkualitas dengan harga terjangkau. Cocok untuk segala momen kebersamaan!',
    media: null // Default kosong
  },
  about: {
    title: 'Tentang Kami',
    description: 'Selamat datang di Mandes Snack & Food, toko cemilan terpercaya...'
  },
  featuredProductIds: [1, 2, 3, 4],
  sectionOrder: ['hero', 'featured', 'about']
};

interface UIContextType {
  config: HomePageConfig;
  updateConfig: (newConfig: Partial<HomePageConfig>) => void;
  resetConfig: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HomePageConfig>(DEFAULT_CONFIG);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('my_app_ui_config');
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch (e) { console.error("Gagal load config", e); }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('my_app_ui_config', JSON.stringify(config));
    }
  }, [config, isInitialized]);

  const updateConfig = (newConfig: Partial<HomePageConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => setConfig(DEFAULT_CONFIG);

  return (
    <UIContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) throw new Error('useUI must be used within UIProvider');
  return context;
}