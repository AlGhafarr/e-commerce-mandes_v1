import midtransClient from 'midtrans-client';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Inisialisasi Core Snap
const snap = new midtransClient.Snap({
    isProduction: isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

export const paymentService = {
    /**
     * Membuat Transaksi Midtrans (Dapat Token & Redirect URL)
     */
    async createTransaction(orderId: string, grossAmount: number, customerDetails: any) {
        try {
            const parameter = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: grossAmount
                },
                credit_card: {
                    secure: true
                },
                customer_details: {
                    first_name: customerDetails.name,
                    email: customerDetails.email,
                    phone: customerDetails.phone
                }
            };

            // Request ke Midtrans
            const transaction = await snap.createTransaction(parameter);
            
            // Return token & url untuk frontend
            return {
                token: transaction.token,
                redirect_url: transaction.redirect_url
            };

        } catch (error: any) {
            console.error("Midtrans Error:", error.message);
            throw new Error("Gagal membuat transaksi pembayaran");
        }
    },

    /**
     * Fungsi Verifikasi Notifikasi (Webhook)
     * Dipanggil saat Midtrans memberi kabar status bayar
     */
    async verifyNotification(notificationBody: any) {
        try {
            // FIX: Tambahkan (snap as any) agar TypeScript tidak error
            // Library midtrans-client TS definition-nya memang kurang lengkap di bagian ini
            const statusResponse = await (snap as any).transaction.notification(notificationBody);
            
            return statusResponse;
        } catch (error: any) {
            console.error("Midtrans Notification Error:", error.message);
            throw error;
        }
    }
};