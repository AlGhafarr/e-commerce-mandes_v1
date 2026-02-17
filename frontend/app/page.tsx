'use client';

import React from 'react';
import ProtectedLink from '@/components/ProtectedLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot'; 
import { ArrowRight, Star, ShoppingCart } from 'lucide-react';
import { useUI } from '@/app/context/UIContext';
import { useProducts } from '@/app/context/ProductContext';

export default function Home() {
  const { config } = useUI(); 
  const { products } = useProducts(); 

  // --- HERO SECTION BESAR ---
  const HeroSection = () => {
    const isVideo = config.hero.media?.startsWith('data:video');

    return (
      <section className="bg-gradient-to-br from-[#C2410C] via-[#F87B1B] to-[#FF9800] text-white rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-xl shadow-orange-900/10 mx-4 lg:mx-0 mt-20 lg:mt-8 min-h-[220px] md:min-h-[350px] lg:min-h-[550px] flex items-center relative isolate">
        
        <div className="container mx-auto px-4 lg:px-16 flex flex-row items-center gap-4 lg:gap-12 z-10 py-6 lg:py-20 h-full">
          
          {/* Kolom Teks (Kiri) */}
          <div className="flex-1 text-left z-20">
            <h1 className="text-xl md:text-4xl lg:text-7xl font-extrabold mb-2 lg:mb-6 leading-tight drop-shadow-md">
              {config.hero.title}
            </h1>
            <p className="text-[10px] md:text-base lg:text-xl mb-4 lg:mb-10 text-white/90 font-medium leading-snug lg:leading-relaxed max-w-[90%] lg:max-w-xl">
              {config.hero.subtitle}
            </p>
            <div className="flex gap-2 lg:gap-4">
              {/* --- GANTI Link MENJADI ProtectedLink (Tombol Belanja) --- */}
              <ProtectedLink href="/products" className="bg-white text-[#C2410C] px-4 py-2 lg:px-8 lg:py-4 rounded-lg lg:rounded-full font-bold hover:bg-orange-50 transition-all shadow-md active:scale-95 text-[10px] lg:text-lg flex items-center justify-center whitespace-nowrap">
                Belanja
              </ProtectedLink>
              
              <button className="px-4 py-2 lg:px-8 lg:py-4 rounded-lg lg:rounded-full font-bold border border-white/70 hover:bg-white/20 transition backdrop-blur-sm text-[10px] lg:text-lg flex items-center justify-center whitespace-nowrap">
                Promo
              </button>
            </div>
          </div>

          {/* Kolom Visual (Kanan) */}
          <div className="flex-1 w-full flex justify-end relative h-full items-center">
            {config.hero.media ? (
              <div className="relative w-[140px] md:w-[280px] lg:w-full max-w-md lg:max-w-xl aspect-square lg:aspect-[4/3] rounded-xl lg:rounded-3xl overflow-hidden z-20 shadow-lg lg:shadow-[0_0_0_8px_#9A3412,0_0_0_16px_rgba(248,123,27,0.5),0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all">
                  {isVideo ? (
                    <video src={config.hero.media} className="w-full h-full object-cover bg-black" autoPlay loop muted playsInline />
                  ) : (
                    <img src={config.hero.media} className="w-full h-full object-cover bg-gray-100" alt="Hero Visual" />
                  )}
              </div>
            ) : (
              <div className="text-[60px] lg:text-[200px] animate-bounce drop-shadow-2xl filter saturate-150">🍿</div>
            )}
          </div>

        </div>
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 rounded-l-full blur-3xl lg:blur-[120px] -z-10"></div>
      </section>
    );
  };

  const FeaturedSection = () => {
    const featuredProducts = products.filter(p => config.featuredProductIds.includes(p.id));
    return (
      <section className="mb-16 px-4 lg:px-0">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Produk Pilihan <span className="text-[#F87B1B]">Terfavorit</span></h2>
            <p className="text-gray-500">Cemilan yang paling banyak dicari minggu ini.</p>
          </div>
          {/* --- GANTI Link MENJADI ProtectedLink (Lihat Semua) --- */}
          <ProtectedLink href="/products" className="text-[#F87B1B] font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Lihat Semua <ArrowRight size={18}/>
          </ProtectedLink>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((item) => (
            // --- GANTI Link MENJADI ProtectedLink (Kartu Produk) ---
            <ProtectedLink key={item.id} href={`/products/${item.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="h-40 md:h-56 bg-gray-100 relative overflow-hidden">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400"/> {item.rating || 4.8}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-[#F87B1B] transition-colors">{item.name}</h3>
                <p className="text-[#F87B1B] font-extrabold text-lg mb-3">Rp {item.price.toLocaleString('id-ID')}</p>
                <button className="w-full py-2 rounded-lg bg-orange-50 text-[#F87B1B] font-bold text-sm group-hover:bg-[#F87B1B] group-hover:text-white transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart size={16}/> Cek Detail
                </button>
              </div>
            </ProtectedLink>
          ))}
          {featuredProducts.length === 0 && <div className="col-span-4 text-center text-gray-400 py-10 bg-gray-50 rounded-xl">Belum ada produk pilihan.</div>}
        </div>
      </section>
    );
  };

  const AboutSection = () => (
    <section className="bg-white rounded-[2.5rem] p-8 md:p-16 mb-16 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col md:flex-row items-center gap-12 md:gap-24 mx-4 lg:mx-0 mt-16">
      
      {/* Logo Circle */}
      <div className="w-40 h-40 md:w-60 md:h-60 bg-gradient-to-br from-[#F87B1B] to-[#FF9800] rounded-full flex items-center justify-center text-white font-bold text-5xl md:text-7xl shadow-2xl border-[8px] border-orange-50 flex-shrink-0 p-1">
        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center shadow-inner">
              {config.logo ? <img src={config.logo} className="w-full h-full object-cover"/> : <span className="text-[#F87B1B]">SN</span>}
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center md:text-left flex-1">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">{config.about.title}</h2>
        <p className="text-gray-600 leading-relaxed text-lg font-medium">{config.about.description}</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-8 mt-12 border-t border-gray-100 pt-10">
          <div><h4 className="text-3xl font-extrabold text-[#F87B1B]">500+</h4><p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Produk</p></div>
          <div><h4 className="text-3xl font-extrabold text-[#F87B1B]">10K+</h4><p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Pelanggan</p></div>
          <div><h4 className="text-3xl font-extrabold text-[#F87B1B]">4.9<Star className="inline -mt-1 ml-1 text-yellow-400" size={20} fill="currentColor"/></h4><p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Rating</p></div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-[#FCF9EA] min-h-screen font-sans">
      <Header />
      
      <main className="container mx-auto pb-16 pt-6 lg:pt-16">
        {/* Render Section Berdasarkan Config Admin */}
        {config.sectionOrder.map((sectionName) => {
          if (sectionName === 'hero') return <HeroSection key="hero" />;
          if (sectionName === 'featured') return <FeaturedSection key="featured" />;
          if (sectionName === 'about') return <AboutSection key="about" />;
          return null;
        })}
      </main>

      <Footer />
      {/* MENAMPILKAN CHATBOT DISINI */}
      <Chatbot />
    </div>
  );
}