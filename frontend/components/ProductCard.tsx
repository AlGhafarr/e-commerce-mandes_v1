'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Eye } from 'lucide-react'

interface Product {
  id: string
  name: string
  image: string
  price: number
  variants: string[]
}

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-transparent hover:border-primary-orange transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-4xl">
          🍪
        </div>
        
        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 animate-fade-in">
            <button className="p-3 bg-white rounded-full hover:bg-primary-orange hover:text-white transition-colors">
              <Eye size={20} />
            </button>
            <button className="p-3 bg-primary-orange text-white rounded-full hover:bg-primary-orange/80 transition-colors">
              <ShoppingCart size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 group-hover:text-primary-orange transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary-orange">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Variants */}
        <div className="flex flex-wrap gap-1">
          {product.variants.map((variant, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-primary-cream text-gray-700 rounded-full"
            >
              {variant}
            </span>
          ))}
        </div>

        <button className="w-full py-2 bg-gradient-orange text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
          Tambah ke Keranjang
        </button>
      </div>
    </div>
  )
}
