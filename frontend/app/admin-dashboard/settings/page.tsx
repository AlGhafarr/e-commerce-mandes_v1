'use client';

import React, { useState, useRef } from 'react';
import { useUI, HomePageConfig } from '@/app/context/UIContext';
import { useProducts } from '@/app/context/ProductContext';
import { Save, Upload, GripVertical, Image as ImageIcon, Layout, Type, RefreshCcw, Video, CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center scale-100 transform transition-all">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Berhasil Disimpan!</h3>
            <p className="text-gray-500 text-sm mb-6">Pengaturan tampilan Home Page telah diperbarui secara live.</p>
            <button onClick={onClose} className="w-full py-3 bg-[#F87B1B] text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-200">
                OK
            </button>
        </div>
    </div>
  );
};

export default function AdminSettings() {
  const { config, updateConfig, resetConfig } = useUI();
  const { products } = useProducts();
  const [localConfig, setLocalConfig] = useState<HomePageConfig>(config);
  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'style'>('layout');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalConfig(prev => ({ ...prev, logo: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleHeroMediaUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        setLocalConfig(prev => ({ 
            ...prev, 
            hero: { ...prev.hero, media: reader.result as string } 
        }));
    };
    reader.readAsDataURL(file);
  };

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _sectionOrder = [...localConfig.sectionOrder];
    const draggedItemContent = _sectionOrder[dragItem.current];
    _sectionOrder.splice(dragItem.current, 1);
    _sectionOrder.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setLocalConfig(prev => ({ ...prev, sectionOrder: _sectionOrder }));
  };

  const handleSave = () => {
    updateConfig(localConfig);
    setIsSuccessOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 w-full max-w-[100vw]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">UI & Home Page</h1>
          <p className="text-sm text-gray-500">Ubah tampilan website secara real-time.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => {resetConfig(); setLocalConfig(config)}} className="flex-1 sm:flex-none justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><RefreshCcw size={16}/> Reset</button>
            <button onClick={handleSave} className="flex-1 sm:flex-none justify-center px-6 py-2 bg-[#F87B1B] text-white rounded-lg text-sm font-bold hover:bg-orange-600 shadow-lg flex items-center gap-2"><Save size={18}/> Simpan</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* SIDEBAR TABS (STACKED ON MOBILE) */}
        <div className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button onClick={() => setActiveTab('layout')} className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'layout' ? 'bg-orange-50 text-[#F87B1B] border border-orange-100' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Layout size={18}/> Tata Letak</button>
            <button onClick={() => setActiveTab('content')} className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'content' ? 'bg-orange-50 text-[#F87B1B] border border-orange-100' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Type size={18}/> Konten Banner</button>
            <button onClick={() => setActiveTab('style')} className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition whitespace-nowrap ${activeTab === 'style' ? 'bg-orange-50 text-[#F87B1B] border border-orange-100' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><ImageIcon size={18}/> Logo & Gaya</button>
        </div>

        {/* MAIN FORM */}
        <div className="flex-1 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
            
            {/* TAB: LAYOUT */}
            {activeTab === 'layout' && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-2">Atur Urutan Halaman Depan</h3>
                    <p className="text-sm text-gray-500 mb-6">Drag & Drop untuk mengubah urutan.</p>
                    <div className="space-y-3 max-w-md touch-none">
                        {localConfig.sectionOrder.map((section, index) => (
                            <div key={section} draggable onDragStart={() => { dragItem.current = index; }} onDragEnter={() => { dragOverItem.current = index; }} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 cursor-move hover:border-[#F87B1B] shadow-sm active:cursor-grabbing">
                                <GripVertical className="text-gray-400 flex-shrink-0" />
                                <div className="flex-1 font-bold text-gray-700 uppercase text-sm">{section === 'hero' ? 'Banner Utama' : section === 'about' ? 'Tentang Kami' : 'Produk Pilihan'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: CONTENT */}
            {activeTab === 'content' && (
                <div className="space-y-8">
                    <h3 className="font-bold text-[#F87B1B] border-b pb-2">Konfigurasi Banner Utama</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Judul Utama</label>
                                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={localConfig.hero.title} onChange={(e) => setLocalConfig({...localConfig, hero: {...localConfig.hero, title: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Sub-judul</label>
                                <textarea className="w-full border p-2 rounded-lg text-sm h-24" value={localConfig.hero.subtitle} onChange={(e) => setLocalConfig({...localConfig, hero: {...localConfig.hero, subtitle: e.target.value}})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Konten Visual (Gambar/Video)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center relative bg-gray-50 hover:bg-orange-50 hover:border-[#F87B1B] transition group cursor-pointer overflow-hidden">
                                {localConfig.hero.media ? (
                                    <>
                                        {localConfig.hero.media.startsWith('data:video') ? (
                                            <video src={localConfig.hero.media} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                        ) : (
                                            <img src={localConfig.hero.media} className="w-full h-full object-contain p-2" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <span className="text-white text-xs font-bold">Klik untuk ganti</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Video className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload Animasi/Gambar</p>
                                        <p className="text-[10px] text-gray-400">(Max 2MB)</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    accept="image/*,video/mp4,video/webm" 
                                    onChange={(e) => e.target.files && handleHeroMediaUpload(e.target.files[0])} 
                                />
                            </div>
                            {localConfig.hero.media && (
                                <button onClick={() => setLocalConfig({...localConfig, hero: {...localConfig.hero, media: null}})} className="text-xs text-red-500 mt-2 hover:underline">Hapus Konten Visual</button>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-bold text-[#F87B1B] mb-4">Produk Pilihan (Featured)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                            {products.map((p) => (
                                <label key={p.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${localConfig.featuredProductIds.includes(p.id) ? 'bg-orange-50 border-[#F87B1B]' : 'hover:bg-gray-50'}`}>
                                    <input type="checkbox" className="accent-[#F87B1B]" checked={localConfig.featuredProductIds.includes(p.id)} onChange={(e) => {
                                        const newIds = e.target.checked ? [...localConfig.featuredProductIds, p.id] : localConfig.featuredProductIds.filter(id => id !== p.id);
                                        setLocalConfig({...localConfig, featuredProductIds: newIds});
                                    }}/>
                                    <img src={p.images[0]} className="w-8 h-8 rounded bg-gray-200 object-cover flex-shrink-0"/>
                                    <span className="text-xs line-clamp-1">{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: STYLE */}
            {activeTab === 'style' && (
                <div className="space-y-6">
                    <h3 className="font-bold text-gray-800">Logo Header</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group bg-gray-50 flex-shrink-0">
                            {localConfig.logo ? <img src={localConfig.logo} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">No Logo</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoUpload} />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-bold text-gray-700">Upload Logo Toko</p>
                            <p className="text-xs text-gray-500 mb-2">Akan tampil di Header dan About Us.</p>
                            {localConfig.logo && <button onClick={() => setLocalConfig({...localConfig, logo: null})} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Hapus Logo</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      <SuccessModal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} />
    </div>
  );
}