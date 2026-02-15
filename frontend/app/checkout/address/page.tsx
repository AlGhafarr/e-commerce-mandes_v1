'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Tambahkan AlertCircle ke import
import { ArrowLeft, MapPin, Navigation, CheckCircle, Loader2, AlertCircle } from 'lucide-react'; 
import dynamic from 'next/dynamic';
import { userService } from '@/services/userService'; 
import { useAuth } from '@/app/context/AuthContext'; 

// Import Peta Client-Side (Dynamic)
const LeafletMap = dynamic(
  () => import('@/components/LeafletMap'), 
  { 
    ssr: false,
    loading: () => <div className="h-[40vh] w-full bg-gray-200 animate-pulse flex items-center justify-center text-gray-400">Memuat Peta...</div>
  }
);

// --- TIPE DATA WILAYAH ---
interface Region {
  id: string;
  name: string;
}

export default function AddressPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth(); 
  
  // State Loading
  const [isLoadingGeo, setIsLoadingGeo] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);       
  
  // --- STATE TOAST (Ganti Alert) ---
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ 
    show: false, message: '', type: 'success' 
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- STATE DATA WILAYAH ---
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]); 
  const [villages, setVillages] = useState<Region[]>([]);   

  // --- STATE FORM ---
  const [formData, setFormData] = useState({
    id: Date.now().toString(),
    label: 'Rumah',
    recipient: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    fullAddress: '',
    notes: '',
    coordinates: [-6.200000, 106.816666] as [number, number] 
  });

  const [selectedIds, setSelectedIds] = useState({
    prov: '',
    city: '',
    dist: '',
    vill: ''
  });

  // --- 1. LOAD DATA PROVINSI ---
  useEffect(() => {
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json`)
      .then(response => response.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Gagal load provinsi:", err));
  }, []);

  // --- 2. HANDLER HIERARKI DROPDOWN ---
  const handleProvChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = provinces.find(p => p.id === provId)?.name || '';
    
    setSelectedIds({ ...selectedIds, prov: provId, city: '', dist: '', vill: '' });
    setFormData({ ...formData, province: provName, city: '', district: '', village: '' });
    setCities([]); setDistricts([]); setVillages([]); 

    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then(res => res.json())
        .then(data => setCities(data));
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const cityName = cities.find(c => c.id === cityId)?.name || '';

    setSelectedIds({ ...selectedIds, city: cityId, dist: '', vill: '' });
    setFormData({ ...formData, city: cityName, district: '', village: '' });
    setDistricts([]); setVillages([]);

    if (cityId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data));
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    const distName = districts.find(d => d.id === distId)?.name || '';

    setSelectedIds({ ...selectedIds, dist: distId, vill: '' });
    setFormData({ ...formData, district: distName, village: '' });
    setVillages([]);

    if (distId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${distId}.json`)
        .then(res => res.json())
        .then(data => setVillages(data));
    }
  };

  const handleVillageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villId = e.target.value;
    const villName = villages.find(v => v.id === villId)?.name || '';

    setSelectedIds({ ...selectedIds, vill: villId });
    setFormData(prev => ({ ...prev, village: villName }));

    if (villName && formData.city) {
      setIsLoadingGeo(true);
      try {
        const query = `${villName}, ${formData.district}, ${formData.city}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          
          setFormData(prev => ({
            ...prev,
            village: villName,
            coordinates: [lat, lon], 
            postalCode: '' 
          }));
        }
      } catch (error) {
        console.error("Gagal sinkronisasi peta:", error);
      } finally {
        setIsLoadingGeo(false);
      }
    }
  };

  // --- 3. HANDLER MAPS ---
  const handlePositionChange = useCallback(async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, coordinates: [lat, lng] }));
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const road = addr.road ? `${addr.road}, ` : '';
        const detail = `${road}${addr.suburb || ''}, ${addr.city || ''}`;
        
        setFormData(prev => ({
          ...prev,
          fullAddress: detail, 
          postalCode: addr.postcode || prev.postalCode, 
          coordinates: [lat, lng]
        }));
      }
    } catch (error) {
      console.error("Gagal reverse geocode:", error);
    }
  }, []);

  // --- 4. GPS HANDLER ---
  const detectLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingGeo(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        handlePositionChange(pos.coords.latitude, pos.coords.longitude);
        setIsLoadingGeo(false);
        showToast("Lokasi ditemukan!", "success"); // Ganti Alert
      }, () => {
        showToast("Gagal mendeteksi lokasi.", "error"); // Ganti Alert
        setIsLoadingGeo(false);
      });
    }
  };

  // --- 5. SIMPAN DATA KE DATABASE ---
  const handleSaveAddress = async () => {
    if (!formData.recipient || !formData.phone || !formData.fullAddress || !formData.province) {
      showToast("Mohon lengkapi data wajib (Nama, HP, Provinsi, Alamat)!", "error"); // Ganti Alert
      return;
    }

    setIsSaving(true);

    try {
        const payload = {
            label: formData.label,
            recipient: formData.recipient,
            phone: formData.phone,
            city: formData.city,
            district: `${formData.district}, ${formData.village}`, 
            postalCode: formData.postalCode,
            fullAddress: `${formData.fullAddress}. (Prov: ${formData.province}, Catatan: ${formData.notes || '-'})`
        };

        await userService.addAddress(payload);

        localStorage.removeItem('selected_address_id'); 
        
        showToast("Alamat berhasil disimpan!", "success"); // Ganti Alert
        
        // Redirect setelah delay sedikit agar user lihat notifikasi
        setTimeout(() => {
            router.push('/checkout');
        }, 1500);

    } catch (error: any) {
        console.error("❌ Gagal simpan:", error);
        showToast(error.message || "Gagal menyimpan alamat", "error"); // Ganti Alert
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      
      {/* HEADER */}
      <header className="bg-white p-4 sticky top-0 z-50 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-[#F87B1B]"><ArrowLeft size={24}/></button>
        <h1 className="text-lg font-bold text-gray-800">Tambah Alamat Baru</h1>
      </header>

      {/* --- TOAST NOTIFICATION (CUSTOM ALERT) --- */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[2000] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-gray-800 text-white border-gray-700' : 'bg-red-500 text-white border-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-green-400"/> : <AlertCircle size={20} className="text-white"/>}
            <span className="text-sm font-bold">{toast.message}</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row h-full">
        
        {/* PETA SECTION */}
        <section className="h-[40vh] lg:h-auto lg:w-1/2 relative bg-gray-200 z-0">
          <LeafletMap 
            position={formData.coordinates} 
            onPositionChange={handlePositionChange} 
          />
          
          <button onClick={detectLocation} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg z-[400] text-[#F87B1B] hover:bg-orange-50 active:scale-95 transition" title="Gunakan Lokasi Saya">
            <Navigation size={24} fill="currentColor" />
          </button>
          
          {isLoadingGeo && (
            <div className="absolute top-4 right-4 z-[400] bg-white/90 px-4 py-2 rounded-full shadow-md flex items-center gap-2 text-xs font-bold text-[#F87B1B] animate-pulse">
                <Loader2 size={16} className="animate-spin"/> Sinkronisasi Peta...
            </div>
          )}

          <div className="absolute top-4 left-4 z-[400] pointer-events-none">
             <div className="bg-white/90 backdrop-blur rounded-lg shadow-md flex items-center px-4 py-2 pointer-events-auto border border-gray-200">
               <MapPin className="text-[#F87B1B] mr-2" size={20}/>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-gray-700">Titik Pengiriman</span>
                 <span className="text-[10px] text-gray-500">Geser pin untuk detail jalan</span>
               </div>
             </div>
          </div>
        </section>

        {/* FORM SECTION */}
        <section className="flex-1 bg-white p-6 lg:overflow-y-auto lg:h-[calc(100vh-64px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:shadow-none rounded-t-3xl lg:rounded-none -mt-6 lg:mt-0 z-10 relative">
          <div className="max-w-lg mx-auto space-y-6 pb-24">
            
            {/* Label Alamat */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Label Alamat</h3>
              <div className="flex gap-2">
                {['Rumah', 'Kantor', 'Kos', 'Lainnya'].map(l => (
                  <button key={l} onClick={() => setFormData({...formData, label: l})} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${formData.label === l ? 'bg-[#F87B1B] text-white border-[#F87B1B]' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Kontak Penerima */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Kontak Penerima</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Lengkap</label>
                  <input type="text" className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-[#F87B1B]" placeholder="Contoh: Budi" value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nomor WhatsApp</label>
                  <input type="tel" className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-[#F87B1B]" placeholder="08..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>

            {/* DATA WILAYAH (HIERARKI DROPDOWN) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                 <h3 className="text-sm font-bold text-gray-700">Data Wilayah</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* 1. PROVINSI */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Provinsi</label>
                  <select className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-[#F87B1B]" value={selectedIds.prov} onChange={handleProvChange}>
                    <option value="">Pilih Provinsi...</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* 2. KOTA/KAB */}
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Kota/Kabupaten</label>
                    <select className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-[#F87B1B] disabled:bg-gray-100" value={selectedIds.city} onChange={handleCityChange} disabled={!selectedIds.prov}>
                      <option value="">Pilih Kota...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* 3. KECAMATAN */}
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Kecamatan</label>
                    <select className="w-full border p-2.5 rounded-lg text-sm bg-white outline-none focus:border-[#F87B1B] disabled:bg-gray-100" value={selectedIds.dist} onChange={handleDistrictChange} disabled={!selectedIds.city}>
                      <option value="">Pilih Kecamatan...</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                
                {/* 4. KELURAHAN (Trigger Maps) */}
                <div className="col-span-2">
                    <label className="text-xs font-bold text-[#F87B1B] mb-1 block flex items-center gap-1">
                        Kelurahan / Desa <CheckCircle size={12}/>
                    </label>
                    <select className="w-full border-2 border-orange-100 p-2.5 rounded-lg text-sm bg-white outline-none focus:border-[#F87B1B] disabled:bg-gray-100" value={selectedIds.vill} onChange={handleVillageChange} disabled={!selectedIds.dist}>
                      <option value="">Pilih Kelurahan (Update Peta)...</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>

                {/* 5. KODE POS (Dropdown / Auto) */}
                <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Kode Pos</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-[#F87B1B]" 
                      value={formData.postalCode} 
                      onChange={e => setFormData({...formData, postalCode: e.target.value})} 
                      placeholder="Pilih kelurahan atau isi manual"
                    />
                </div>
                
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Detail Jalan / Patokan</label>
              <textarea 
                className="w-full border p-3 rounded-lg text-sm h-24 outline-none focus:border-[#F87B1B] bg-gray-50" 
                placeholder="Nama jalan, Nomor Rumah, RT/RW (Otomatis terisi saat geser peta)" 
                value={formData.fullAddress} 
                onChange={e => setFormData({...formData, fullAddress: e.target.value})} 
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Catatan Kurir (Opsional)</label>
              <input type="text" className="w-full border p-2.5 rounded-lg text-sm outline-none" placeholder="Warna rumah, pagar hitam, dll" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>

          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 z-50 lg:static lg:bg-transparent lg:border-none lg:p-0">
        <div className="max-w-lg mx-auto lg:px-6 lg:pb-6 lg:ml-auto lg:mr-0 lg:w-1/2">
           <button 
             onClick={handleSaveAddress} 
             disabled={isSaving}
             className="w-full bg-[#F87B1B] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle size={20}/> Simpan Alamat</>}
           </button>
        </div>
      </div>
    </div>
  );
}