import axios from 'axios';

const BITESHIP_API_URL = 'https://api.biteship.com/v1';
const BITESHIP_KEY = process.env.BITESHIP_API_KEY;

export const biteshipService = {
    async createOrder(orderData: any) {
        try {
            // Struktur Payload Biteship
            const payload = {
                origin_contact_name: "Mandes Snack",
                origin_contact_phone: "081234567890",
                origin_address: "Jl. Toko Pusat No. 1, Jakarta", // Bisa ambil dari ENV/DB Config toko
                origin_postal_code: 12345,
                origin_coordinate: {
                    latitude: -6.200000,
                    longitude: 106.816666
                },
                destination_contact_name: orderData.customerName,
                destination_contact_phone: orderData.customerPhone,
                destination_address: orderData.addressFull,
                destination_postal_code: orderData.postalCode, 
                // destination_coordinate: ... (Opsional jika ada)
                courier_company: orderData.courierCode, // e.g., "jne", "sicepat"
                courier_type: orderData.courierService, // e.g., "reg", "best"
                delivery_type: "now",
                items: orderData.items.map((item: any) => ({
                    name: item.product.name,
                    description: "Snack makanan ringan",
                    value: item.price,
                    quantity: item.quantity,
                    weight: 200 // Default weight per item (gram), sebaiknya ambil dari DB product
                }))
            };

            const response = await axios.post(`${BITESHIP_API_URL}/orders`, payload, {
                headers: { 'Authorization': BITESHIP_KEY, 'Content-Type': 'application/json' }
            });

            return response.data; // Berisi info resi (waybill_id) dan tracking
        } catch (error: any) {
            console.error("Biteship Booking Error:", error.response?.data || error.message);
            // Jangan throw error agar webhook midtrans tidak gagal total, cukup log error manual booking nanti
            return null; 
        }
    }
};