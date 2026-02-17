// ✅ GUNAKAN JALUR PROXY (Satu domain dengan Frontend)
// Ini agar mandes_admin_token terbawa otomatis dan tidak kena blokir CORS/Mixed Content
const API_URL = '/api/proxy/products'; 

export const productService = {
  // 1. GET ALL PRODUCTS 
  async getAll() {
    const res = await fetch(API_URL, { 
      method: 'GET',
      cache: 'no-store',
      // credentials: 'include' memastikan cookie admin dikirim ke backend via proxy
      credentials: 'include' 
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Akses Ditolak: Butuh Login Admin");
      throw new Error("Gagal mengambil daftar produk");
    }
    return res.json();
  },

  // 2. GET PRODUCT BY ID 
  async getById(id: string) {
    const res = await fetch(`${API_URL}/${id}`, { 
      method: 'GET',
      cache: 'no-store',
      credentials: 'include' 
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Akses Ditolak: Butuh Login Admin");
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
      // Menangkap pesan error spesifik dari backend jika ada
      throw new Error(errorData.error || 'Gagal menyimpan produk');
    }
    return await res.json();
  },

  // 4. UPDATE (PUT/PATCH) 
  // Catatan: Cek backend Anda menggunakan PUT atau PATCH untuk produk
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

    if (!res.ok) {
        if (res.status === 401) throw new Error("Akses Ditolak: Butuh Login Admin");
        throw new Error('Gagal menghapus produk');
    }
    return await res.json();
  }
};