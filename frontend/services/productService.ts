const API_URL = 'http://10.253.128.163:4721/api/products';

export const productService = {
  // 1. GET ALL PRODUCTS 
  async getAll() {
    const res = await fetch(API_URL, { 
      cache: 'no-store',
      // WAJIB DITAMBAHKAN: Agar cookie token terkirim saat ambil data
      credentials: 'include' 
    });

    if (!res.ok) {
      // Deteksi jika errornya karena belum login (401)
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Gagal mengambil daftar produk");
    }
    return res.json();
  },

  // 2. GET PRODUCT BY ID 
  async getById(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { 
      cache: 'no-store',
      credentials: 'include' 
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Gagal ambil detail produk");
    }
    return res.json();
  },

  // 3. CREATE (POST) 
  async create(data: any) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include' 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Gagal menyimpan produk');
    }
    return await res.json();
  },

  // 4. UPDATE (PUT) 
  async update(id: string, data: any) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include' 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gagal update produk");
    }
    return res.json();
  },

  // 5. DELETE (DELETE)
  async delete(id: string) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include' 
    });

    if (!res.ok) throw new Error('Gagal menghapus produk');
    return await res.json();
  }
};