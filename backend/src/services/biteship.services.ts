import axios from 'axios';

const BITESHIP_API_URL = 'https://api.biteship.com/v1';

export const biteshipService = {
    async createOrder(orderData: any) {
        try {
            // Panggil ENV di dalam fungsi agar aman dari urutan loading
            const BITESHIP_KEY = process.env.BITESHIP_API_KEY;
            
            if (!BITESHIP_KEY) {
                console.error("🚨 FATAL ERROR: BITESHIP_API_KEY belum diset di .env backend!");
                return null;
            }

            // Struktur Payload Biteship
            const payload = {
                origin_contact_name: "Mandes Snack",
                origin_contact_phone: "081234567890",
                origin_address: "Jl. Toko Pusat No. 1, Jakarta", // Sesuaikan alamat asal toko
                origin_postal_code: 12345,
                origin_coordinate: {
                    latitude: -6.200000,
                    longitude: 106.816666
                },
                destination_contact_name: orderData.customerName,
                destination_contact_phone: orderData.customerPhone,
                destination_address: orderData.addressFull,
                destination_postal_code: orderData.postalCode, 
                courier_company: orderData.courierCode, // misal: "jne"
                courier_type: orderData.courierService, // misal: "reg"
                delivery_type: "now",
                
                // ✅ FIX: Baca item langsung dari payload controller
                items: orderData.items.map((item: any) => ({
                    name: item.name, 
                    description: item.description || "Snack makanan ringan",
                    value: item.value,
                    quantity: item.quantity,
                    weight: item.weight || 200 
                }))
            };

            const response = await axios.post(`${BITESHIP_API_URL}/orders`, payload, {
                headers: { 
                    // Sebagian besar API Key Biteship tidak butuh kata "Bearer ", langsung masukkan key-nya
                    'Authorization': BITESHIP_KEY, 
                    'Content-Type': 'application/json' 
                }
            });

            return response.data; // Berisi info resi (waybill_id) dan tracking
            
        } catch (error: any) {
            // Tampilkan detail error asli dari server Biteship agar mudah di-debug
            const errorMessage = error.response?.data?.error || error.response?.data || error.message;
            console.error("🚨 Biteship Booking Error:", errorMessage);
            
            // Jangan throw error agar webhook midtrans tidak gagal total
            return null; 
        }
    }
};