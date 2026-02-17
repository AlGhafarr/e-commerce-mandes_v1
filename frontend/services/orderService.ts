// ✅ GUNAKAN JALUR PROXY 
// Menggunakan domain yang sama agar mandes_admin_token terbawa otomatis
const API_URL = '/api/proxy'; 

export const orderService = {
    // 1. Get All Orders (Admin)
    async getAllAdmin() {
        // Menembak ke /api/proxy/admin/orders
        const res = await fetch(`${API_URL}/admin/orders`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // credentials: 'include' WAJIB agar token admin dikirim ke backend
            credentials: 'include' 
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error("Akses Ditolak: Sesi Admin Kadaluarsa");
            throw new Error('Gagal mengambil data pesanan admin');
        }
        
        const data = await res.json();
        
        // Mapping format backend (snake_case) ke format frontend (camelCase)
        return data.map((o: any) => ({
            id: o.id || o.order_id,
            customer: o.customerName || o.user?.name || 'Guest',
            total: Number(o.totalAmount || o.total || 0),
            date: new Date(o.date || o.created_at).toLocaleDateString('id-ID'),
            paymentMethod: o.paymentMethod || o.payment_method || 'Midtrans',
            status: o.status,
            trackingId: o.trackingId || o.tracking_id || o.waybill_id,
            courier: o.courier || o.courier_name || 'Kurir Toko',
            address: o.address || o.shipping_address || '-',
            items: o.items ? o.items.map((i: any) => ({
                name: i.productName || i.name,
                qty: i.quantity || i.qty,
                price: Number(i.price || 0),
                image: i.image || i.product_image || 'https://placehold.co/100'
            })) : []
        }));
    },

    // 2. Update Status Order
    async updateStatus(orderId: string, status: string) {
        // Menembak ke /api/proxy/admin/orders/:id/status
        const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
            // ✅ MENGGUNAKAN PATCH (Sesuai dengan admin.route.ts di backend Anda)
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Gagal update status pesanan');
        }
        return await res.json();
    }
};