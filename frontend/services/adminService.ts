// ✅ GUNAKAN JALUR PROXY INTERNAL
// Ini memastikan request dikirim ke domain mandessnack.shop sehingga cookie terbawa
const API_URL = '/api/proxy/admin'; 

export const adminService = {
    // Ambil Data Pelanggan
    async getCustomers() {
        // Menembak ke /api/proxy/admin/customers
        const res = await fetch(`${API_URL}/customers`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // credentials: 'include' WAJIB agar token admin dikirim oleh browser
            credentials: 'include' 
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error("Akses Ditolak: Sesi Admin Habis");
            throw new Error('Gagal mengambil data pelanggan');
        }
        return await res.json();
    },

    // Ambil Data Pesanan
    async getOrders() {
        // Menembak ke /api/proxy/admin/orders
        const res = await fetch(`${API_URL}/orders`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error("Akses Ditolak: Sesi Admin Habis");
            throw new Error('Gagal mengambil data pesanan');
        }
        return await res.json();
    }
};