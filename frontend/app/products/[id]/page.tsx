'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Minus, Plus, ShoppingCart, Heart, Search, MessageCircle, ArrowLeft, Maximize2, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; 
import { productService } from '../../../services/productService';
import { cartService } from '../../../services/cartService'; 
import { useAuth } from '@/app/context/AuthContext';
import Chatbot from '@/components/Chatbot';
import { authEvents } from '@/utils/event';

export default function ProductDetail() {
  const params = useParams();
  const productId = params.id as string; 
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- UI STATE ---
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantName, setSelectedVariantName] = useState("");
  const [selectedSizeName, setSelectedSizeName] = useState("");
  
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<'cart' | 'buy'>('cart');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await productService.getById(productId);
        
        // Mapping data agar aman
        const mappedProduct = {
            ...data,
            price: data.basePrice || 0, 
            images: data.images?.length > 0 ? data.images : ['https://placehold.co/600x600?text=No+Image'],
            variants: data.variants?.length > 0 ? data.variants : [{ name: 'Default', priceModifier: 0 }],
            sizes: data.sizes?.length > 0 ? data.sizes : [{ name: 'Standard', priceMultiplier: 1 }],
            stocks: data.stocks || [], 
            reviews: [] 
        };

        setProduct(mappedProduct);
        if(mappedProduct.variants.length > 0) setSelectedVariantName(mappedProduct.variants[0].name);
        if(mappedProduct.sizes.length > 0) setSelectedSizeName(mappedProduct.sizes[0].size);

      } catch (error) {
        console.error("Gagal ambil produk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- LOGIC HARGA & STOK ---
  const uniqueVariantNames = useMemo(() => {
    if (!product?.variants) return [];
    return Array.from(new Set(product.variants.map((v: any) => v.name))) as string[];
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product?.variants) return [];
    return Array.from(new Set(product.variants.map((v: any) => v.size))) as string[];
  }, [product]);

  const activeVariantData = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find((v: any) => 
        v.name === selectedVariantName && v.size === selectedSizeName
    );
  }, [product, selectedVariantName, selectedSizeName]);

  const currentPrice = activeVariantData ? activeVariantData.price : (product?.price || 0);
  const currentStock = activeVariantData ? activeVariantData.stock : (product?.stock || 0);
  const isOutOfStock = currentStock === 0;
  const totalPrice = currentPrice * quantity;
  
  const { averageRating, totalReviewsCount } = useMemo(() => {
    return { averageRating: '5.0', totalReviewsCount: 0 }; 
  }, [product]);

  // --- HANDLERS ---
  const handleQuantity = (type: 'inc' | 'dec') => {
    if (type === 'inc' && quantity < currentStock) setQuantity(q => q + 1);
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleMobileClick = (type: 'cart' | 'buy') => {
    setModalActionType(type);
    setIsMobileModalOpen(true);
  };

  // --- LOGIC TRANSAKSI (PEMISAH CART vs BUY) ---
  const handleTransaction = async (type: 'cart' | 'buy') => {
    // 1. Validasi
    if (!activeVariantData) {
        triggerToast("Varian stok ini tidak tersedia.");
        return;
    }
    
    // 2. Cek Loading Session Auth
    if (isLoading) {
        return; 
    }

    // 3. Cek Login
    if (!isAuthenticated) {
        setIsMobileModalOpen(false);
        authEvents.triggerLoginModal(); 
        return;
    }
    
    setIsMobileModalOpen(false);

    // --- CASE 1: BELI LANGSUNG (DIRECT) ---
    if (type === 'buy') {
        const variantString = `${selectedVariantName} - ${selectedSizeName}`;
        const url = `/checkout?mode=direct&productId=${product.id}&qty=${quantity}&variant=${encodeURIComponent(variantString)}`;
        router.push(url);
        return;
    }

    // --- CASE 2: MASUK KERANJANG (CART) ---
    setIsSubmitting(true);
    try {
        // ✅ GANTI FETCH MANUAL DENGAN CART SERVICE
        // Service ini otomatis menggunakan jalur /api/proxy/cart
        await cartService.addToCart(
            product.id, 
            selectedVariantName, 
            selectedSizeName, 
            quantity
        );

        // Sukses masuk keranjang
        triggerToast(`Berhasil masuk keranjang!\n${product.name}`);

    } catch (error: any) {
        console.error(error);
        
        // 3. HANDLE AUTO-LOGIN MODAL
        // Jika service melempar error "UNAUTHORIZED", trigger login modal
        if (error.message === "UNAUTHORIZED") {
            authEvents.triggerLoginModal();
        } else {
            triggerToast(error.message || "Gagal memproses permintaan.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FCF9EA]"><Loader2 className="animate-spin text-[#F87B1B]" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-[#FCF9EA]">Produk tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-[#FCF9EA] pb-24 lg:pb-12 relative font-sans">
      <header className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 ${isScrolled ? 'bg-white/95 shadow-sm backdrop-blur-sm' : 'bg-transparent lg:bg-white/50 lg:backdrop-blur-sm'}`}>
        <Link href="/products" className="p-2 rounded-full bg-white/60 hover:bg-white text-gray-700 shadow-sm transition backdrop-blur-md"><ArrowLeft size={20} /></Link>
        <div className={`transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'} font-bold text-[#F87B1B] text-lg`}>SN</div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full bg-white/60 hover:bg-white text-[#F87B1B] shadow-sm backdrop-blur-md"><Search size={20} /></button>
          <button className="p-2 rounded-full bg-white/60 hover:bg-white text-[#F87B1B] shadow-sm backdrop-blur-md"><MessageCircle size={20} /></button>
        </div>
      </header>

      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 shadow-black/20"><CheckCircle size={20} className="text-green-400"/><span className="text-sm font-bold whitespace-pre-line text-center">{toastMessage}</span></div>
      </div>

      <main className="container mx-auto px-0 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-2 lg:space-y-4">
             {/* IMAGE GALLERY */}
             <div className="bg-white lg:rounded-2xl relative group shadow-sm">
               <div className="relative h-[300px] md:h-[380px] lg:h-[420px] w-full bg-gray-50 lg:rounded-t-2xl overflow-hidden flex items-center justify-center">
                 <img src={product.images[activeImage]} alt={product.name} className="h-full w-auto object-contain transition-transform duration-500 cursor-zoom-in" onClick={() => setIsImageZoomed(true)} />
                 <button onClick={() => setIsImageZoomed(true)} className="absolute bottom-4 right-4 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm backdrop-blur-sm transition"><Maximize2 size={18} /></button>
               </div>
               <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-white lg:rounded-b-2xl border-t border-gray-50">
                 {product.images.map((img: string, idx: number) => (
                   <button key={idx} onClick={() => setActiveImage(idx)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-[#F87B1B] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                     <img src={img} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
             </div>

             {/* INFO PRODUK */}
             <div className="px-4 lg:px-0 space-y-3 pb-4">
               <div className="bg-white p-4 lg:p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start gap-4">
                   <h1 className="text-lg lg:text-xl font-bold text-gray-800 leading-snug flex-1">{product.name}</h1>
                   <div className="flex gap-2">
                     <button onClick={() => setIsWishlist(!isWishlist)} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"><Heart fill={isWishlist ? "#ef4444" : "none"} className={isWishlist ? "text-red-500" : ""} size={18} /></button>
                   </div>
                 </div>
                 <div className="mt-2 flex items-end gap-2">
                   <span className="text-2xl font-bold text-[#F87B1B]">Rp {currentPrice.toLocaleString('id-ID')}</span>
                 </div>
                 <div className="flex items-center gap-2 mt-3 text-sm border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold"><Star fill="currentColor" size={16}/> {averageRating}</div>
                    <span className="text-gray-300">|</span>
                    <div className="text-gray-500">{totalReviewsCount} Ulasan</div>
                 </div>
               </div>
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-800 mb-3 text-sm">Deskripsi Produk</h3>
                 <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
               </div>
             </div>
          </div>

          {/* DESKTOP SIDEBAR ACTION */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-20 space-y-3"> 
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 text-base">Atur Pesanan</h3>
                
                <div className="mb-3">
                  <label className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Pilih Varian</label>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueVariantNames.map((name, idx) => (
                      <button key={idx} onClick={() => setSelectedVariantName(name)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedVariantName === name ? 'bg-[#F87B1B]/10 border-[#F87B1B] text-[#F87B1B]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{name}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[11px] font-bold text-gray-500 uppercase mb-1.5 block">Pilih Ukuran</label>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueSizes.map((size, idx) => (
                      <button key={idx} onClick={() => setSelectedSizeName(size)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedSizeName === size ? 'bg-[#F87B1B]/10 border-[#F87B1B] text-[#F87B1B]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{size}</button>
                    ))}
                  </div>
                </div>

                {!activeVariantData && <div className="mb-3 p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-700 flex items-center gap-1.5"><AlertCircle size={14}/> <span>Kombinasi ini tidak tersedia</span></div>}
                
                <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center border border-gray-300 rounded-lg px-1 py-0.5 w-fit hover:border-[#F87B1B] transition-colors">
                    <button onClick={() => handleQuantity('dec')} disabled={quantity <= 1} className="p-1.5 text-gray-500 hover:text-[#F87B1B] disabled:opacity-30"><Minus size={16} /></button>
                    <input type="text" value={quantity} readOnly className="w-10 text-center font-bold text-sm text-gray-800 outline-none" />
                    <button onClick={() => handleQuantity('inc')} disabled={quantity >= currentStock} className="p-1.5 text-[#F87B1B] hover:text-orange-700 disabled:opacity-30"><Plus size={16} /></button>
                  </div>
                  <div className="text-xs text-right">
                    <p className="text-gray-500">Stok: <span className="font-bold text-gray-800">{currentStock}</span></p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-xl">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-800">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>

                <div className="space-y-2">
                  <button onClick={() => handleTransaction('cart')} disabled={!activeVariantData || isOutOfStock || isSubmitting} className="w-full py-2.5 bg-[#F87B1B] text-white font-bold text-sm rounded-xl hover:bg-orange-600 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><ShoppingCart size={16}/> + Keranjang</>}
                  </button>
                  <button onClick={() => handleTransaction('buy')} disabled={!activeVariantData || isOutOfStock || isSubmitting} className="w-full py-2.5 bg-white border border-[#F87B1B] text-[#F87B1B] font-bold text-sm rounded-xl hover:bg-orange-50 transition-all active:scale-95 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="animate-spin text-[#F87B1B]" size={16}/> : 'Beli Langsung'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
        <div className="flex gap-3 items-center">
          <button className="p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 active:scale-95 transition-transform">
            <MessageCircle size={20} />
          </button>
          <div className="flex-1 flex gap-2">
            <button onClick={() => handleMobileClick('cart')} className="flex-1 bg-orange-50 border border-[#F87B1B] text-[#F87B1B] py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
              + Keranjang
            </button>
            <button onClick={() => handleMobileClick('buy')} className="flex-1 bg-[#F87B1B] text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-200 active:scale-95 transition-transform">
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MODAL */}
      {isMobileModalOpen && (
        <>
            <div className={`fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300 lg:hidden opacity-100 visible`} onClick={() => setIsMobileModalOpen(false)} />
            <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[80] p-5 shadow-2xl transition-transform duration-300 lg:hidden translate-y-0`}>
                <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={product.images[0] || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 relative pt-1">
                        <button onClick={() => setIsMobileModalOpen(false)} className="absolute top-0 right-0 text-gray-400 p-2"><X size={24}/></button>
                        <div className="pr-8">
                        <p className="text-xl font-bold text-[#F87B1B] mb-1">Rp {totalPrice.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-500">Stok: {currentStock} • {selectedVariantName} - {selectedSizeName}</p>
                        </div>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-6 pb-24 scrollbar-hide">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {uniqueVariantNames.map((name, idx) => (
                                <button key={idx} onClick={() => setSelectedVariantName(name)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${selectedVariantName === name ? 'bg-[#F87B1B]/10 text-[#F87B1B] border-[#F87B1B]' : 'bg-white border-gray-200'}`}>{name}</button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {uniqueSizes.map((size, idx) => (
                                <button key={idx} onClick={() => setSelectedSizeName(size)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${selectedSizeName === size ? 'bg-[#F87B1B]/10 text-[#F87B1B] border-[#F87B1B]' : 'bg-white border-gray-200'}`}>{size}</button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                         <span className="text-sm font-bold text-gray-600">Jumlah</span>
                         <div className="flex items-center border border-gray-300 rounded-lg px-1 py-0.5">
                            <button onClick={() => handleQuantity('dec')} disabled={quantity <= 1} className="p-2 text-gray-500 hover:text-[#F87B1B] disabled:opacity-30"><Minus size={16} /></button>
                            <input type="text" value={quantity} readOnly className="w-10 text-center font-bold text-sm text-gray-800 outline-none" />
                            <button onClick={() => handleQuantity('inc')} disabled={quantity >= currentStock} className="p-2 text-[#F87B1B] hover:text-orange-700 disabled:opacity-30"><Plus size={16} /></button>
                         </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                    <button 
                        onClick={() => handleTransaction(modalActionType)}
                        disabled={!activeVariantData || isOutOfStock || isSubmitting}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none ${!activeVariantData || isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#F87B1B] text-white shadow-orange-200'}`}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : !activeVariantData ? 'Tidak Tersedia' : isOutOfStock ? 'Stok Habis' : modalActionType === 'cart' ? 'Masukkan Keranjang' : 'Beli Sekarang'}
                    </button>
                </div>
            </div>
        </>
      )}

      {isImageZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
          <button onClick={() => setIsImageZoomed(false)} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 transition"><X size={24} /></button>
          <img src={product.images[activeImage]} alt="Zoomed" className="max-w-full max-h-full object-contain animate-in zoom-in-95" />
        </div>
      )}

      <Chatbot />
    </div>
  );
}