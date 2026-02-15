// app/context/ProductContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS as INITIAL_DATA, Product } from '@/app/data/products';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_DATA);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load data dari LocalStorage saat pertama kali buka (Simulasi Database Load)
  useEffect(() => {
    const savedData = localStorage.getItem('my_app_products');
    if (savedData) {
      setProducts(JSON.parse(savedData));
    }
    setIsInitialized(true);
  }, []);

  // 2. Simpan ke LocalStorage setiap ada perubahan (Simulasi Database Save)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('my_app_products', JSON.stringify(products));
    }
  }, [products, isInitialized]);

  // Fungsi Tambah
  const addProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Fungsi Edit
  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) => 
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // Fungsi Hapus (Soft Delete / Hard Delete)
  const deleteProduct = (id: number) => {
    // Bisa diganti soft delete jika mau
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

// Hook agar mudah dipanggil di mana saja
export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}