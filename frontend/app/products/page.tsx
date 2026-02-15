'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Star, ShoppingCart, ChevronLeft, ChevronRight, RotateCcw, Search, X, ArrowUpDown, MessageCircle, ArrowUp, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot'; 
import Link from 'next/link'; 

// --- PERUBAHAN 1: Import Service API (Sesuaikan path jika perlu) ---
// Asumsi file ini ada di folder app/products/page.tsx, maka path ke services mundur 2 langkah
import { productService } from '../../services/productService'; 

export default function ProductPage() {
  // --- PERUBAHAN 2: State Lokal untuk Data DB ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterInput, setFilterInput] = useState({ category: 'Semua', minPrice: '', maxPrice: '', minRating: 0 });
  const [activeFilter, setActiveFilter] = useState({ category: 'Semua', minPrice: '', maxPrice: '', minRating: 0 });
  const [sortOption, setSortOption] = useState('default'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // --- PERUBAHAN 3: Fetch Data dari API ---
  useEffect(() => {
    setIsMounted(true);
    
    const fetchFromDB = async () => {
      setLoading(true);
      try {
        const data = await productService.getAll();
        
        // Mapping Data DB ke Format UI Frontend
        // DB pakai 'basePrice', UI pakai 'price'. DB belum ada review, kita default ke 0 atau 5.
        const mappedData = data.map((item: any) => ({
          ...item,
          price: item.basePrice, // PENTING: Mapping harga
          rating: 0, // Default karena belum ada tabel review
          reviews: [],
          sold: 0,   // Default
          images: item.images && item.images.length > 0 ? item.images : ['https://placehold.co/400x400?text=No+Image']
        }));

        setProducts(mappedData);
      } catch (error) {
        console.error("Gagal ambil produk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFromDB();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemsPerPage = 12;

  // --- HELPER: HITUNG RATING ---
  const calculateRating = (p: any) => {
    // Karena data DB belum ada review, kita return default atau random untuk demo visual
    if (!p.reviews || p.reviews.length === 0) return p.rating || "Baru"; 
    const sum = p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    return (sum / p.reviews.length).toFixed(1);
  };

  // --- FILTER LOGIC (Tetap Sama) ---
  let processedProducts = products.filter((product) => {
    const matchCategory = activeFilter.category === 'Semua' || product.category === activeFilter.category;
    const formMin = activeFilter.minPrice === '' ? 0 : Number(activeFilter.minPrice);
    const formMax = activeFilter.maxPrice === '' ? Infinity : Number(activeFilter.maxPrice);
    const matchPrice = product.price >= formMin && product.price <= formMax;
    
    // Logic rating dimatikan dulu jika belum ada data review real
    // const currentRating = parseFloat(calculateRating(product) as string);
    // const matchRating = currentRating >= activeFilter.minRating;
    
    return matchCategory && matchPrice; // && matchRating;
  });

  if (sortOption === 'price_asc') processedProducts.sort((a, b) => a.price - b.price);
  if (sortOption === 'price_desc') processedProducts.sort((a, b) => b.price - a.price);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const currentProducts = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- HANDLERS ---
  const handleApplyFilter = () => {
    setIsMobileFilterOpen(false);
    setActiveFilter(filterInput);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilter = () => {
    const def = { category: 'Semua', minPrice: '', maxPrice: '', minRating: 0 };
    setFilterInput(def);
    setActiveFilter(def);
    setSortOption('default');
    setCurrentPage(1);
  };

  const handleSortSelect = (val: string) => {
    setSortOption(val);
    setIsSortDropdownOpen(false);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!isMounted) return null;

  // --- FILTER UI ---
  const FilterContent = (
    <div className="space-y-6">
      <div className="flex justify-between mb-4 border-b pb-4">
        <div className="flex gap-2 items-center"><Filter size={20} className="text-[#F87B1B]"/><h3 className="font-bold text-gray-800">Filter</h3></div>
        <button onClick={handleResetFilter} className="text-xs text-gray-400 flex gap-1 items-center hover:text-[#F87B1B]"><RotateCcw size={12}/> Reset</button>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-2 text-gray-700">Kategori</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {['Semua', 'Keripik', 'Basreng', 'Kacang', 'Manisan', 'Paket Bundling'].map(cat => (
            <li key={cat} className="flex gap-2 items-center cursor-pointer hover:text-[#F87B1B]">
              <input type="radio" checked={filterInput.category === cat} onChange={() => setFilterInput({...filterInput, category: cat})} className="accent-[#F87B1B] cursor-pointer"/> {cat}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-2 text-gray-700">Harga</h4>
        <div className="flex flex-col gap-2">
          <input type="number" placeholder="Min" className="border p-2 rounded text-sm outline-none focus:border-[#F87B1B]" value={filterInput.minPrice} onChange={e => setFilterInput({...filterInput, minPrice: e.target.value})} />
          <input type="number" placeholder="Max" className="border p-2 rounded text-sm outline-none focus:border-[#F87B1B]" value={filterInput.maxPrice} onChange={e => setFilterInput({...filterInput, maxPrice: e.target.value})} />
        </div>
      </div>
      <button onClick={handleApplyFilter} className="w-full bg-[#F87B1B] text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-orange-200">Terapkan Filter</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCF9EA]">
      <div className="hidden lg:block"><Header /></div>
      
      {/* MOBILE HEADER (Sticky) */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#FCF9EA] transition-all duration-300 shadow-sm ${isScrolled ? 'h-16 shadow-md' : 'h-auto pb-4'}`}>
        <div className="container mx-auto px-4 pt-4 flex justify-between items-start">
          <div className="w-10"></div>
          <div className={`flex flex-col items-center transition-all duration-300 transform ${isScrolled ? 'scale-75 translate-y-1' : 'scale-100'}`}>
            <div className="w-10 h-10 bg-[#F87B1B] rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">SN</div>
            <div className={`text-center mt-1 transition-all ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}><h1 className="text-[#F87B1B] font-bold text-sm leading-tight">Mandes Snack</h1></div>
          </div>
          <div className={`flex gap-3 transition-opacity ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button className="text-[#F87B1B] p-2"><Search size={20}/></button>
            <button className="text-[#F87B1B] p-2"><MessageCircle size={20}/></button>
          </div>
        </div>
      </div>
      
      <div className={`lg:hidden transition-all duration-300 ${isScrolled ? 'pt-20' : 'pt-24'}`}></div>

      <main className="container mx-auto px-4 pb-20 lg:pt-32 lg:pb-12">
        <div className="lg:hidden mb-4 mt-2"><Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#F87B1B] text-xs font-bold uppercase p-2 -ml-2"><ArrowLeft size={16}/> Kembali ke Beranda</Link></div>
        
        {/* BANNER */}
        <Link href="/">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6 border-l-4 border-[#F87B1B] mt-2 lg:mt-0 cursor-pointer hover:shadow-md transition">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-800">Katalog <span className="text-[#F87B1B]">Snack Pilihan</span> 🍿</h1>
              <p className="text-gray-500 text-xs md:text-sm mt-1">{products.length} produk tersedia</p>
            </div>
          </div>
        </Link>

        {/* MOBILE FILTER BAR */}
        <div className={`lg:hidden mb-6 flex gap-2 sticky transition-all duration-300 z-40 bg-[#FCF9EA] py-2 ${isScrolled ? 'top-16' : 'top-0'}`}>
          <button onClick={() => setIsMobileFilterOpen(true)} className="flex-none bg-white border border-gray-200 h-10 px-4 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 text-gray-700 active:scale-95 transition"><Filter size={14}/> Filter</button>
          <div className="relative flex-1 h-10">
            <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="w-full h-full bg-white border border-gray-200 rounded-lg px-3 text-xs font-medium flex items-center justify-between shadow-sm text-gray-700 active:scale-95 transition">
              <span className="truncate">{sortOption === 'default' ? 'Paling Sesuai' : sortOption === 'price_asc' ? 'Termurah' : 'Termahal'}</span>
              <ArrowUpDown size={12} className="text-gray-400"/>
            </button>
            {isSortDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />}
            {isSortDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95">
                {[{val:'default',label:'Paling Sesuai'},{val:'price_asc',label:'Harga Termurah'},{val:'price_desc',label:'Harga Termahal'}].map(o => (
                  <button key={o.val} onClick={() => handleSortSelect(o.val)} className={`w-full text-left px-4 py-2 text-xs hover:bg-orange-50 ${sortOption===o.val ? 'text-[#F87B1B] font-bold' : 'text-gray-600'}`}>{o.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 hidden lg:block h-fit sticky top-32"><div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">{FilterContent}</div></aside>
          
          {/* MOBILE FILTER MODAL */}
          <div className={`fixed inset-0 bg-black/50 z-[60] lg:hidden transition-opacity duration-300 ${isMobileFilterOpen?'opacity-100 visible':'opacity-0 invisible'}`} onClick={() => setIsMobileFilterOpen(false)}/>
          <div className={`fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl p-5 transition-transform duration-300 lg:hidden ${isMobileFilterOpen?'translate-x-0':'-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="font-bold text-lg text-gray-800">Filter Produk</h2>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
            </div>
            {FilterContent}
          </div>

          <section className="lg:w-3/4 w-full">
            {/* LOADING STATE */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 size={40} className="animate-spin text-[#F87B1B] mb-4"/>
                    <p>Memuat produk...</p>
                </div>
            ) : processedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"><Search size={24} className="text-[#F87B1B]"/></div>
                <h3 className="font-bold text-gray-800">Produk tidak ditemukan</h3>
                <p className="text-xs text-gray-500 mt-1">Coba kurangi filter atau cari kata kunci lain.</p>
                <button onClick={handleResetFilter} className="mt-4 text-[#F87B1B] text-sm font-semibold hover:underline">Reset Filter</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {currentProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="block h-full">
                    <div className="bg-white rounded-xl shadow-sm border border-transparent hover:border-orange-200 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
                      <div className="relative h-40 md:h-52 bg-gray-100 overflow-hidden">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm">{product.category}</span>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 mb-1 min-h-[32px] group-hover:text-[#F87B1B] transition-colors">{product.name}</h3>
                        <div className="mb-2"><span className="text-sm md:text-lg font-extrabold text-[#F87B1B]">Rp {product.price.toLocaleString('id-ID')}</span></div>
                        
                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-dashed border-gray-100">
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400"/>
                            <span className="text-[10px] font-medium text-gray-600">{calculateRating(product)}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">| {product.sold} Terjual</span>
                        </div>
                        
                        <button className="mt-3 w-full bg-orange-50 text-[#F87B1B] hover:bg-[#F87B1B] hover:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all">
                          <ShoppingCart size={14}/> <span className="hidden md:inline">Keranjang</span>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {!loading && processedProducts.length > 0 && (
              <div className="flex justify-center items-center mt-10 gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:border-[#F87B1B] hover:text-[#F87B1B] transition"><ChevronLeft size={18} /></button>
                <span className="text-xs font-bold text-gray-600 px-2">Hal {currentPage} / {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:border-[#F87B1B] hover:text-[#F87B1B] transition"><ChevronRight size={18} /></button>
              </div>
            )}
          </section>
        </div>
      </main>
      
      <div className="hidden lg:block"><Footer /></div>
      
      {/* SCROLL TO TOP (POSISI KIRI) */}
      <button 
        onClick={scrollToTop} 
        className={`fixed bottom-6 left-6 bg-[#F87B1B] text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ArrowUp size={24}/>
      </button>

      {/* CHATBOT INTEGRATION */}
      <Chatbot />
    </div>
  );
}