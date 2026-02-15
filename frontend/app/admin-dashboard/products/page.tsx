'use client';

import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService'; 
import { Plus, Edit, Trash2, X, Save, Upload, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

// --- TIPE DATA ---
interface StockItem {
  variantName: string;
  sizeName: string; // Hasil gabungan (misal: "250gr")
  stock: number;
  finalPrice: number; // Disimpan untuk display & payload
}

interface ProductForm {
  id?: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  
  // Data Frontend (UI Helper)
  variants: { name: string; priceModifier: number; status: string; estimation: string }[];
  
  // UPDATE: priceMultiplier diubah jadi priceModifier (Penambahan Harga)
  sizes: { value: string; unit: string; priceModifier: number }[];
  
  stocks: StockItem[];
  stock: number; // Total stok
}

// --- KOMPONEN MODAL (ALERT CUSTOM) ---
const ConfirmSaveModal = ({ isOpen, data, onConfirm, onCancel, isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4 text-[#F87B1B]">
          <AlertCircle size={28} />
          <h3 className="text-lg font-bold text-gray-800">Konfirmasi Simpan</h3>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2 mb-6 border border-gray-100 max-h-60 overflow-y-auto">
          <p><span className="font-bold">Nama:</span> {data.name}</p>
          <p><span className="font-bold">Harga Dasar:</span> Rp {data.price.toLocaleString('id-ID')}</p>
          <p><span className="font-bold">Total Varian:</span> {data.stocks.length} Kombinasi</p>
          <div className="mt-2 border-t pt-2">
            <p className="font-bold mb-1">Total Stok: {data.stock} Unit</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isLoading} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#F87B1B] text-white hover:bg-orange-600 shadow-lg shadow-orange-200 flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={18}/> : "Ya, Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, title, message, onConfirm, onCancel, isDanger, singleButton }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F87B1B]'}`}>
            {isDanger ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
          </div>
          {!singleButton && <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>}
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          {!singleButton && (
            <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button>
          )}
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#F87B1B] hover:bg-orange-600'}`}>
            {singleButton ? "OK" : "Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Alert State
  const [alertData, setAlertData] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    action: () => {}, 
    isDanger: false,
    singleButton: false 
  });

  // Default Form
  const defaultForm: ProductForm = {
    name: '', price: 0, stock: 0,
    description: '', category: 'Keripik',
    images: [],
    variants: [{ name: 'Original', priceModifier: 0, status: 'ready', estimation: '' }],
    // UPDATE: Default Modifier 0 (Karena penjumlahan)
    sizes: [{ value: '', unit: 'gr', priceModifier: 0 }], 
    stocks: []
  };
  const [formData, setFormData] = useState<ProductForm>(defaultForm);

  // --- 1. FETCH DATA ---
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Gagal ambil data", error);
      showAlert("Error", "Gagal terhubung ke database.", true, true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Helper Alert
  const showAlert = (title: string, message: string, isDanger = false, singleButton = false, action = () => setAlertData(prev => ({...prev, isOpen: false}))) => {
    setAlertData({ isOpen: true, title, message, isDanger, singleButton, action });
  };

  // --- 2. LOGIC GENERATE STOK & HARGA (THE FIX: PENJUMLAHAN) ---
  useEffect(() => {
    if (!isModalOpen) return;
    
    const newStocks: StockItem[] = [];
    
    // Loop Kombinasi Varian x Ukuran
    formData.variants.forEach(v => {
      formData.sizes.forEach(s => {
        // Generate Nama Ukuran
        const combinedSizeName = s.value ? `${s.value}${s.unit}` : `Unknown-${s.unit}`;

        const base = Number(formData.price) || 0;
        const varMod = Number(v.priceModifier) || 0;
        const sizeMod = Number(s.priceModifier) || 0; // Sekarang ini Penambah, bukan Pengali
        
        // --- PERBAIKAN RUMUS DI SINI ---
        // Lama: (base + varMod) * multiplier
        // Baru: base + varMod + sizeMod
        const calculatedPrice = base + varMod + sizeMod;

        // Cek stok lama
        const existing = formData.stocks.find(st => st.variantName === v.name && st.sizeName === combinedSizeName);

        newStocks.push({
          variantName: v.name,
          sizeName: combinedSizeName,
          stock: existing ? existing.stock : 0,
          finalPrice: calculatedPrice
        });
      });
    });

    const isStructureDifferent = JSON.stringify(newStocks.map(s => s.sizeName + s.variantName)) !== JSON.stringify(formData.stocks.map(s => s.sizeName + s.variantName));
    const isPriceDifferent = JSON.stringify(newStocks.map(s => s.finalPrice)) !== JSON.stringify(formData.stocks.map(s => s.finalPrice));

    if (isStructureDifferent || isPriceDifferent) {
       const mergedStocks = newStocks.map(ns => {
           const old = formData.stocks.find(os => os.variantName === ns.variantName && os.sizeName === ns.sizeName);
           return old ? { ...ns, stock: old.stock } : ns;
       });
       setFormData(prev => ({ ...prev, stocks: mergedStocks }));
    }
  }, [formData.variants, formData.sizes, formData.price]); 


  // --- 3. HANDLERS ---
  const handleImageFile = (file: File) => {
    if(file.size > 1024 * 1024) {
        return showAlert("File Terlalu Besar", "Maksimal ukuran file adalah 1MB", true, true);
    }
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
    reader.readAsDataURL(file);
  };

  const openModal = (product?: any) => {
    if (product) {
      setIsEditing(true);
      setFormData({
        id: product.id,
        name: product.name,
        price: product.basePrice,
        description: product.description || '',
        category: product.category || 'Keripik',
        images: product.images || [],
        stock: product.stock,
        variants: [{ name: 'Standard', priceModifier: 0, status: 'ready', estimation: '' }],
        sizes: [{ value: '', unit: 'pcs', priceModifier: 0 }],
        stocks: []
      });
      showAlert("Mode Edit", "Struktur varian di-reset untuk menjaga konsistensi data. Silakan atur ulang varian jika diperlukan.", false, true);
    } else {
      setIsEditing(false);
      setFormData({ ...defaultForm });
    }
    setIsModalOpen(true);
  };

  const handlePreSave = () => {
    if (!formData.name) return showAlert("Data Kurang", "Nama produk wajib diisi!", true, true);
    if (formData.price <= 0) return showAlert("Data Kurang", "Harga dasar tidak boleh 0!", true, true);
    if (formData.sizes.some(s => !s.value)) return showAlert("Data Kurang", "Nilai ukuran kemasan wajib diisi!", true, true);

    const totalStock = formData.stocks.reduce((acc, curr) => acc + curr.stock, 0);
    setFormData(prev => ({ ...prev, stock: totalStock })); 
    setIsConfirmOpen(true);
  };

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    try {
      // Transform UI Data -> Backend Payload
      const backendVariants = formData.stocks.map(item => ({
        name: item.variantName,
        size: item.sizeName,
        price: item.finalPrice, 
        stock: item.stock
      }));

      const payload = {
        name: formData.name,
        description: formData.description,
        basePrice: formData.price,
        stock: formData.stock,
        category: formData.category,
        images: formData.images,
        variants: backendVariants
      };

      if (isEditing && formData.id) {
        await productService.update(formData.id, payload);
      } else {
        await productService.create(payload);
      }

      await fetchProducts(); 
      setIsConfirmOpen(false);
      setIsModalOpen(false);
      showAlert("Sukses", "Produk berhasil disimpan!", false, true);

    } catch (error: any) {
      console.error(error);
      setIsConfirmOpen(false); 
      showAlert("Gagal Menyimpan", error.message || "Terjadi kesalahan server", true, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.delete(id);
      setAlertData(prev => ({ ...prev, isOpen: false }));
      fetchProducts();
    } catch (error) {
      showAlert("Gagal Menghapus", "Terjadi kesalahan saat menghapus produk", true, true);
    }
  };

  const confirmDelete = (product: any) => {
    showAlert(
        "Hapus Produk?", 
        `Apakah Anda yakin ingin menghapus "${product.name}"? Data tidak bisa dikembalikan.`, 
        true, 
        false, 
        () => handleDelete(product.id)
    );
  };

  const updateStockValue = (vName: string, sName: string, val: number) => {
    const newStocks = formData.stocks.map(s => 
      (s.variantName === vName && s.sizeName === sName) ? { ...s, stock: val } : s
    );
    setFormData({ ...formData, stocks: newStocks });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="font-sans w-full max-w-[100vw]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk (DB Connected)</h1>
        <button onClick={() => openModal()} className="bg-[#F87B1B] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-lg shadow-orange-200 w-full sm:w-auto justify-center">
            <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 w-full">
        {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="animate-spin mb-2 text-[#F87B1B]" size={32}/>
                <p>Memuat data produk...</p>
            </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <tr>
                <th className="p-4">Produk</th>
                <th className="p-4">Harga Dasar</th>
                <th className="p-4">Total Stok</th>
                <th className="p-4 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 flex items-center gap-3">
                    <img src={product.images[0] || 'https://placehold.co/100'} className="w-10 h-10 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{product.name}</span>
                        <span className="text-xs text-gray-400">{product.variants?.length || 0} Varian</span>
                    </div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                        Rp {product.basePrice?.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">{product.stock} Unit</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openModal(product)} className="p-2 text-[#F87B1B] hover:bg-orange-50 rounded-lg"><Edit size={18}/></button>
                    <button onClick={() => confirmDelete(product)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                    </td>
                </tr>
                ))}
                {filteredProducts.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada produk.</td></tr>
                )}
            </tbody>
            </table>
        </div>
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Info Dasar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Produk</label>
                  <input type="text" className="w-full border p-2.5 rounded-lg text-sm focus:border-[#F87B1B] outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Harga Dasar (Rp)</label>
                  <input type="number" className="w-full border p-2.5 rounded-lg text-sm focus:border-[#F87B1B] outline-none" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kategori</label>
                  <select className="w-full border p-2.5 rounded-lg text-sm bg-white focus:border-[#F87B1B] outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Keripik</option><option>Basreng</option><option>Kacang</option><option>Manisan</option></select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Deskripsi</label>
                  <textarea className="w-full border p-2.5 rounded-lg text-sm h-24 focus:border-[#F87B1B] outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* Gambar */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Foto Produk</label>
                <div className="flex gap-3 flex-wrap">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button onClick={() => {const ni=[...formData.images]; ni.splice(i,1); setFormData({...formData, images: ni})}} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"><X size={12}/></button>
                    </div>
                  ))}
                  <label 
                    onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]) }} 
                    onDragOver={e => e.preventDefault()}
                    className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#F87B1B] hover:bg-orange-50 text-gray-400 hover:text-[#F87B1B]"
                  >
                    <Upload size={24} className="mb-1" /><span className="text-[10px] font-bold">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageFile(e.target.files[0])} />
                  </label>
                </div>
              </div>

              {/* Varian */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between mb-4 items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase">Varian & Pre-Order</label>
                  <button onClick={() => setFormData({...formData, variants: [...formData.variants, {name:'', priceModifier:0, status:'ready', estimation:''}]})} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-lg font-bold text-[#F87B1B] hover:shadow-sm">+ Tambah</button>
                </div>
                <div className="space-y-3">
                  {formData.variants.map((v, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex gap-2 w-full">
                          <input type="text" className="flex-1 border p-2 rounded text-xs min-w-0 outline-none focus:border-[#F87B1B]" value={v.name} onChange={e => { const nv:any=[...formData.variants]; nv[i].name=e.target.value; setFormData({...formData, variants:nv}) }} placeholder="Nama Varian" />
                          <input type="number" className="w-20 border p-2 rounded text-xs outline-none focus:border-[#F87B1B]" value={v.priceModifier} onChange={e => { const nv:any=[...formData.variants]; nv[i].priceModifier=Number(e.target.value); setFormData({...formData, variants:nv}) }} placeholder="+Rp" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                          <select className={`flex-1 sm:w-auto border p-2 rounded text-xs font-medium ${v.status==='preorder'?'text-blue-600 bg-blue-50':v.status==='out_of_stock'?'text-red-500 bg-red-50':'text-green-600 bg-green-50'}`} value={v.status} onChange={e => { const nv:any=[...formData.variants]; nv[i].status=e.target.value; setFormData({...formData, variants:nv}) }}>
                            <option value="ready">Ready</option><option value="preorder">Pre-Order</option><option value="out_of_stock">Habis</option>
                          </select>
                          <button onClick={() => {const nv=[...formData.variants]; nv.splice(i,1); setFormData({...formData, variants:nv})}} className="text-red-400 p-2 ml-auto sm:ml-0 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ukuran Kemasan (UPDATED: Penambahan Harga, Bukan Pengali) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between mb-4 items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ukuran & Satuan</label>
                  <button onClick={() => setFormData({...formData, sizes: [...formData.sizes, {value:'', unit:'gr', priceModifier:0}]})} className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-lg font-bold text-[#F87B1B] hover:shadow-sm">+ Ukuran</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {formData.sizes.map((s, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2 rounded-lg border border-gray-200">
                      
                      <div className="flex-1 w-full sm:w-auto">
                        <input type="text" className="w-full border p-2 rounded text-xs min-w-0 outline-none focus:border-[#F87B1B]" value={s.value} onChange={e => { const ns:any=[...formData.sizes]; ns[i].value=e.target.value; setFormData({...formData, sizes:ns}) }} placeholder="Berat/Isi (Cth: 250)" />
                      </div>

                      <select className="bg-gray-50 border p-2 rounded text-xs font-medium text-gray-700 focus:outline-none focus:border-[#F87B1B]" value={s.unit} onChange={e => { const ns:any=[...formData.sizes]; ns[i].unit=e.target.value; setFormData({...formData, sizes:ns}) }}>
                        <option value="gr">gram (gr)</option>
                        <option value="kg">kilogram (kg)</option>
                        <option value="pcs">pcs</option>
                        <option value="bks">bungkus</option>
                        <option value="bal">bal</option>
                        <option value="ml">ml</option>
                      </select>

                      {/* MODIFIER HARGA (PENAMBAHAN) */}
                      <div className="flex items-center gap-1 w-24 flex-shrink-0 bg-orange-50 px-2 rounded border border-orange-100">
                        {/* UPDATE LABEL: "+ Rp" agar user tahu ini penambahan rupiah */}
                        <span className="text-xs text-orange-400 font-bold">+ Rp</span>
                        <input type="number" className="w-full bg-transparent p-2 rounded text-xs text-right font-bold text-orange-700 outline-none" value={s.priceModifier} onChange={e => { const ns:any=[...formData.sizes]; ns[i].priceModifier=Number(e.target.value); setFormData({...formData, sizes:ns}) }} />
                      </div>

                      <button onClick={() => {const ns=[...formData.sizes]; ns.splice(i,1); setFormData({...formData, sizes:ns})}} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stok Preview & Input */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <label className="text-xs font-bold text-orange-700 uppercase mb-3 block">Atur Stok per Item & Cek Harga</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                  {formData.stocks?.map((stokItem, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-orange-200 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{stokItem.variantName}</span>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800">{stokItem.sizeName}</span>
                            <span className="text-[10px] text-orange-600 font-mono">Rp {stokItem.finalPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <label className="text-[9px] text-gray-400">Stok</label>
                            <input 
                            type="number" 
                            className="w-16 border border-gray-300 rounded p-1 text-center text-sm font-bold focus:border-[#F87B1B] outline-none"
                            value={stokItem.stock}
                            onChange={(e) => updateStockValue(stokItem.variantName, stokItem.sizeName, Number(e.target.value))}
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 w-full sm:w-auto">Batal</button>
              <button onClick={handlePreSave} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F87B1B] text-white hover:bg-orange-600 flex items-center justify-center gap-2 shadow-lg shadow-orange-100 w-full sm:w-auto"><Save size={18}/> Simpan Produk</button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-ups Custom */}
      <ConfirmSaveModal 
        isOpen={isConfirmOpen} 
        data={formData} 
        onConfirm={handleFinalSave} 
        onCancel={() => setIsConfirmOpen(false)} 
        isLoading={isSubmitting}
      />
      
      <AlertModal 
        isOpen={alertData.isOpen} 
        title={alertData.title} 
        message={alertData.message} 
        onConfirm={alertData.action} 
        onCancel={() => setAlertData({...alertData, isOpen: false})} 
        isDanger={alertData.isDanger}
        singleButton={alertData.singleButton}
      />
    </div>
  );
}