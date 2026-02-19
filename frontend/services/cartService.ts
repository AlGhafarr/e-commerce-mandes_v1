// frontend/services/cartService.ts

// ✅ GUNAKAN JALUR PROXY 
// Agar request ke Keranjang dianggap satu domain dengan Frontend
const API_URL = 'https://api.mandessnack.shop/api'; 

export const cartService = {
  /**
   * Menambah produk ke keranjang belanja customer
   */
  addToCart: async (productId: string, variant: string, size: string, qty: number) => {
    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            productId, 
            variant, 
            size, 
            quantity: qty 
        }),
        // 🚨 SANGAT PENTING: Agar cookie 'mandes_token' (bukan admin) ikut terkirim
        credentials: 'include' 
      });

      if (res.status === 401) {
        // Jika 401, ini yang memicu frontend menampilkan Modal Login
        throw new Error("UNAUTHORIZED");
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menambahkan ke keranjang");
      }

      return await res.json();
    } catch (error) {
      console.error("Cart Error:", error);
      throw error;
    }
  },

  /**
   * Mengambil isi keranjang belanja (Opsional, jika ada halamannya)
   */
  getCart: async () => {
    const res = await fetch(`${API_URL}/cart`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("Gagal mengambil isi keranjang");
    return await res.json();
  }
};