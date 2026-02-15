// app/data/products.ts

export type VariantType = {
  name: string;
  priceModifier: number; // Tambahan harga (misal: +1000)
  status: 'ready' | 'preorder' | 'out_of_stock';
  estimation?: string; // Angka estimasi hari (misal: "7")
};

export type SizeType = {
  name: string;
  priceMultiplier: number; // Pengali harga (misal: x2.2)
};

// Tipe untuk manajemen stok detail per kombinasi
export type StockType = {
  variantName: string;
  sizeName: string;
  stock: number;
};

// Tipe untuk Ulasan
export type ReviewType = {
  id: number;
  userName: string;
  rating: number; // 1 sampai 5
  comment: string;
  date: string;
};

export interface Product {
  id: number;
  name: string;
  price: number; // Harga dasar
  originalPrice: number;
  rating: number;
  reviews_count: number;
  sold: number;
  description: string;
  category: string;
  location: string;
  images: string[];
  variants: VariantType[];
  sizes: SizeType[];
  
  // Stok Detail (Kombinasi Varian + Ukuran)
  stocks: StockType[]; 
  
  // Helper field (total stok global, opsional)
  stock?: number; 

  // Tambahkan field reviews
  reviews: ReviewType[]; 
}

// DATA DUMMY AWAL (Untuk inisialisasi)
export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Keripik Singkong Balado Pedas Nampol",
    price: 15000,
    originalPrice: 20000,
    rating: 4.8,
    reviews_count: 128,
    sold: 1200,
    stock: 150, // Total
    category: "Keripik",
    location: "Jakarta Selatan",
    description: "Keripik singkong renyah dengan bumbu balado rahasia turun temurun. Cocok untuk teman nonton.",
    images: [
      "https://placehold.co/600x600/F87B1B/white?text=Keripik+Balado",
      "https://placehold.co/600x600/orange/white?text=Detail+Tekstur",
    ],
    variants: [
      { name: "Level 1", priceModifier: 0, status: 'ready', estimation: '' },
      { name: "Level 3", priceModifier: 1000, status: 'ready', estimation: '' },
      { name: "Level 5", priceModifier: 2000, status: 'preorder', estimation: '3' },
    ],
    sizes: [
      { name: "100gr", priceMultiplier: 1 },
      { name: "250gr", priceMultiplier: 2.2 },
      { name: "500gr", priceMultiplier: 4 },
    ],
    stocks: [
      { variantName: "Level 1", sizeName: "100gr", stock: 20 },
      { variantName: "Level 1", sizeName: "250gr", stock: 15 },
      { variantName: "Level 1", sizeName: "500gr", stock: 10 },
      { variantName: "Level 3", sizeName: "100gr", stock: 25 },
      { variantName: "Level 3", sizeName: "250gr", stock: 20 },
      { variantName: "Level 3", sizeName: "500gr", stock: 10 },
      { variantName: "Level 5", sizeName: "100gr", stock: 20 },
      { variantName: "Level 5", sizeName: "250gr", stock: 20 },
      { variantName: "Level 5", sizeName: "500gr", stock: 10 },
    ],
    reviews: [
      { id: 101, userName: "Budi Santoso", rating: 5, comment: "Pedasnya nampol banget! Keripiknya renyah, nggak keras. Mantap buat temen nonton.", date: "2023-10-25" },
      { id: 102, userName: "Siti Aminah", rating: 4, comment: "Enak, bumbunya berasa. Cuma pengirimannya agak lama sedikit kemarin. Tapi produk oke.", date: "2023-10-20" },
      { id: 103, userName: "Rudi Hartono", rating: 5, comment: "Langganan beli di sini. Level 5 nya juara!", date: "2023-10-15" },
    ],
  },
  {
    id: 2,
    name: "Basreng Pedas Daun Jeruk",
    price: 35000,
    originalPrice: 45000,
    rating: 4.9,
    reviews_count: 85,
    sold: 850,
    stock: 90,
    category: "Basreng",
    location: "Bandung",
    description: "Basreng ikan tenggiri asli dengan irisan daun jeruk segar yang wangi.",
    images: [
      "https://placehold.co/600x600/orange/white?text=Basreng",
      "https://placehold.co/600x600/F87B1B/white?text=Kemasan+Basreng",
    ],
    variants: [
      { name: "Original", priceModifier: 0, status: 'ready', estimation: '' },
      { name: "Pedas", priceModifier: 0, status: 'ready', estimation: '' },
      { name: "Extra Pedas", priceModifier: 1500, status: 'out_of_stock', estimation: '' },
    ],
    sizes: [
      { name: "250gr", priceMultiplier: 1 },
      { name: "500gr", priceMultiplier: 1.9 },
    ],
    stocks: [
      { variantName: "Original", sizeName: "250gr", stock: 30 },
      { variantName: "Original", sizeName: "500gr", stock: 15 },
      { variantName: "Pedas", sizeName: "250gr", stock: 30 },
      { variantName: "Pedas", sizeName: "500gr", stock: 15 },
      { variantName: "Extra Pedas", sizeName: "250gr", stock: 0 }, // Out of stock
      { variantName: "Extra Pedas", sizeName: "500gr", stock: 0 },
    ],
    reviews: [],
  },
  {
    id: 3,
    name: "Kacang Atom Gurih Renyah",
    price: 12000,
    originalPrice: 15000,
    rating: 4.7,
    reviews_count: 200,
    sold: 2100,
    stock: 100,
    category: "Kacang",
    location: "Jakarta Barat",
    description: "Kacang atom dengan balutan tepung berbumbu gurih.",
    images: ["https://placehold.co/600x600/F87B1B/white?text=Kacang+Atom"],
    variants: [
      { name: "Original", priceModifier: 0, status: 'ready', estimation: '' },
    ],
    sizes: [
      { name: "100gr", priceMultiplier: 1 },
      { name: "250gr", priceMultiplier: 2.3 },
    ],
    stocks: [
      { variantName: "Original", sizeName: "100gr", stock: 60 },
      { variantName: "Original", sizeName: "250gr", stock: 40 },
    ],
    reviews: [],
  },
  {
    id: 4,
    name: "Manisan Mangga Segar",
    price: 25000,
    originalPrice: 30000,
    rating: 4.6,
    reviews_count: 45,
    sold: 500,
    stock: 20,
    category: "Manisan",
    location: "Bogor",
    description: "Manisan mangga asli Bogor, segar dan tanpa pemanis buatan.",
    images: ["https://placehold.co/600x600/orange/white?text=Manisan"],
    variants: [
      { name: "Basah", priceModifier: 0, status: 'ready', estimation: '' },
      { name: "Kering", priceModifier: 2000, status: 'preorder', estimation: '5' },
    ],
    sizes: [
      { name: "250gr", priceMultiplier: 1 },
    ],
    stocks: [
      { variantName: "Basah", sizeName: "250gr", stock: 10 },
      { variantName: "Kering", sizeName: "250gr", stock: 10 },
    ],
    reviews: [],
  },
  {
    id: 5,
    name: "Tempe Sagu Renyah 5 Liter",
    price: 45000,
    originalPrice: 50000,
    rating: 4.5,
    reviews_count: 10,
    sold: 60,
    stock: 10,
    category: "Keripik",
    location: "Malang",
    description: "Keripik tempe sagu super renyah dalam kemasan toples besar.",
    images: ["https://placehold.co/600x600/orange/white?text=Tempe+Sagu"],
    variants: [
      { name: "Original", priceModifier: 0, status: 'ready', estimation: '' },
    ],
    sizes: [
      { name: "Toples 5L", priceMultiplier: 1 },
    ],
    stocks: [
      { variantName: "Original", sizeName: "Toples 5L", stock: 10 },
    ],
    reviews: [],
  },
  {
    id: 6,
    name: "Usus Crispy Renyah Gurih 1kg",
    price: 65000,
    originalPrice: 75000,
    rating: 4.6,
    reviews_count: 30,
    sold: 500,
    stock: 30,
    category: "Keripik",
    location: "Surabaya",
    description: "Usus ayam crispy anti alot, digoreng kering.",
    images: ["https://placehold.co/600x600/orange/white?text=Usus+Crispy"],
    variants: [
      { name: "Original", priceModifier: 0, status: 'ready', estimation: '' },
      { name: "Balado", priceModifier: 2000, status: 'ready', estimation: '' },
    ],
    sizes: [
      { name: "500gr", priceMultiplier: 0.6 },
      { name: "1kg", priceMultiplier: 1 },
    ],
    stocks: [
      { variantName: "Original", sizeName: "500gr", stock: 10 },
      { variantName: "Original", sizeName: "1kg", stock: 5 },
      { variantName: "Balado", sizeName: "500gr", stock: 10 },
      { variantName: "Balado", sizeName: "1kg", stock: 5 },
    ],
    reviews: [],
  }
];