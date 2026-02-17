// ✅ GUNAKAN JALUR PROXY
// Menggunakan domain yang sama agar cookie token terbawa otomatis
const API_BASE_URL = '/api/proxy'; 

export const userService = {
  
  // 1. AMBIL DAFTAR ALAMAT
  async getAddresses() {
    const res = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      },
      // credentials: 'include' WAJIB agar Cookie Token user dikirim
      credentials: 'include', 
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized: Sesi habis");
      throw new Error("Gagal mengambil data alamat");
    }

    return await res.json();
  },

  // 2. TAMBAH ALAMAT BARU
  async addAddress(data: any) {
    const res = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
      credentials: 'include' 
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error("Gagal menyimpan alamat baru");
    }

    return await res.json();
  },

  // 3. RIWAYAT PESANAN
  async getOrders() {
    const res = await fetch(`${API_BASE_URL}/user/orders`, { 
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json' 
      },
      credentials: 'include',
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error("Gagal mengambil riwayat pesanan");
    }

    return await res.json();
  }
};