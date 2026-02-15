// frontend/services/orderService.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';

export const orderService = {
    // 1. Get All Orders (Admin)
    async getAllAdmin() {
        const res = await fetch(`${API_URL}/admin/orders`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Kirim cookie token admin
        });

        if (!res.ok) throw new Error('Gagal mengambil data pesanan admin');
        
        const data = await res.json();
        
        // Mapping format backend ke format frontend (Order Interface)
        return data.map((o: any) => ({
            id: o.id,
            customer: o.customerName,
            total: o.totalAmount,
            date: new Date(o.date).toLocaleDateString('id-ID'),
            paymentMethod: o.paymentMethod || 'Midtrans',
            status: o.status,
            trackingId: o.trackingId,
            courier: o.courier || 'Kurir Toko',
            address: o.address || '-', // Pastikan backend kirim ini atau handle null
            items: o.items ? o.items.map((i: any) => ({
                name: i.productName,
                qty: i.quantity,
                price: i.price,
                image: 'https://placehold.co/100' // Placeholder gambar
            })) : []
        }));
    },

    // 2. Update Status Order
    async updateStatus(orderId: string, status: string) {
        const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Gagal update status pesanan');
        return await res.json();
    }
};