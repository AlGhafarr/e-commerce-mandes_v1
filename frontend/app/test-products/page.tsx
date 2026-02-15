'use client'; // Wajib, karena kita fetch data dari Browser

import { useEffect, useState } from 'react';
import { productService } from '@/services/productService';

interface Product {
  id: string;
  name: string;
  basePrice: number;
  stock: number;
  description: string;
}

export default function TestProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await productService.getAll();
      setProducts(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-10"> Sedang memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
         Test Integrasi Backend
      </h1>
      
      {products.length === 0 ? (
        <p className="text-red-500">Data kosong atau gagal konek ke API.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{item.description}</p>
              
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-green-600 font-bold">
                  Rp {item.basePrice.toLocaleString('id-ID')}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Stok: {item.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}