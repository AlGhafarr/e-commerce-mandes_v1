const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';

export const adminService = {
    // Ambil Data Pelanggan
    async getCustomers() {
        const res = await fetch(`${API_URL}/admin/customers`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Kirim Token Cookie
        });

        if (!res.ok) throw new Error('Gagal mengambil data pelanggan');
        return await res.json();
    },

    // Ambil Data Pesanan
    async getOrders() {
        const res = await fetch(`${API_URL}/admin/orders`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        return await res.json();
    }
};