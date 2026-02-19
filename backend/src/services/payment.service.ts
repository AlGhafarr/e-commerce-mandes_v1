import midtransClient from 'midtrans-client';

export const paymentService = {
    /**
     * Membuat Transaksi Midtrans (Dapat Token & Redirect URL)
     */
    async createTransaction(orderId: string, grossAmount: number, customerDetails: any) {
        
        // 1. CEK KEY (ALARM DEBUGGING)
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            console.error("🚨 FATAL ERROR: MIDTRANS_SERVER_KEY kosong atau tidak terbaca di .env!");
            throw new Error("Sistem pembayaran belum dikonfigurasi dengan benar.");
        }

        // 2. INISIALISASI DI SINI (Agar aman dari urutan load dotenv)
        const snap = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: serverKey,
            clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
        });

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
            
            return {
                token: transaction.token,
                redirect_url: transaction.redirect_url
            };

        } catch (error: any) {
            // Log ini akan memberitahu Anda ALASAN PASTI dari Midtrans
            console.error("🚨 Midtrans API Error Detail:", error.message);
            throw new Error("Gagal membuat transaksi pembayaran");
        }
    },

    /**
     * Fungsi Verifikasi Notifikasi (Webhook)
     */
    async verifyNotification(notificationBody: any) {
        const snap = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY || '',
            clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
        });

        try {
            const statusResponse = await (snap as any).transaction.notification(notificationBody);
            return statusResponse;
        } catch (error: any) {
            console.error("Midtrans Notification Error:", error.message);
            throw error;
        }
    }
};