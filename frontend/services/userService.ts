// Sesuaikan dengan IP Server Backend Anda
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';

export const userService = {
  
  // 1. AMBIL DAFTAR ALAMAT
  async getAddresses() {
    const res = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // WAJIB: Agar Cookie Token dikirim
      cache: 'no-store'       // Agar data selalu fresh
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
      credentials: 'include' // WAJIB
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
      credentials: 'include', // WAJIB
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      throw new Error("Gagal mengambil riwayat pesanan");
    }

    return await res.json();
  }
};