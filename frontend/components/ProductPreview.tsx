'use client'

import Link from 'next/link'
import ProductCard from './ProductCard'
import { ArrowRight } from 'lucide-react'

// Mock data - akan diganti dengan data dari database
const featuredProducts = [
  {
    id: '1',
    name: 'Keripik Singkong Original',
    image: '/products/keripik-1.jpg',
    price: 15000,
    variants: ['Original', 'Pedas', 'BBQ'],
  },
  {
    id: '2',
    name: 'Kacang Mete Premium',
    image: '/products/kacang-1.jpg',
    price: 45000,
    variants: ['Original', 'Asin', 'Manis'],
  },
  {
    id: '3',
    name: 'Stick Keju Crispy',
    image: '/products/stick-1.jpg',
    price: 25000,
    variants: ['Keju', 'Coklat', 'Green Tea'],
  },
  {
    id: '4',
    name: 'Banana Chips',
    image: '/products/pisang-1.jpg',
    price: 18000,
    variants: ['Original', 'Coklat', 'Keju'],
  },
  {
    id: '5',
    name: 'Makaroni Spiral',
    image: '/products/makaroni-1.jpg',
    price: 12000,
    variants: ['Pedas', 'Keju', 'BBQ'],
  },
  {
    id: '6',
    name: 'Kacang Thailand',
    image: '/products/kacang-thai.jpg',
    price: 20000,
    variants: ['Original', 'Pedas', 'BBQ'],
  },
]

export default function ProductPreview() {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-orange">
            Produk Pilihan
          </h2>
          <p className="text-gray-600 mt-2">
            Cemilan favorit pilihan pelanggan
          </p>
        </div>
      </div>

      {/* Product Grid - 2 columns on mobile, responsive on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center pt-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-orange text-white rounded-xl font-semibold hover:shadow-xl transition-all"
        >
          Lihat Semua Produk
          <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  )
}