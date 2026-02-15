import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
    isProduction: false, // Ubah true jika live
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
});

export const midtransService = {
    // Fungsi membuat transaksi (mendapatkan Snap Token)
    async createTransaction(orderId: string, amount: number, customerDetails: any, items: any[]) {
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone,
                shipping_address: customerDetails.address // Object alamat lengkap
            },
            item_details: items.map(item => ({
                id: item.productId,
                price: item.price,
                quantity: item.quantity,
                name: item.name
            }))
        };

        try {
            const transaction = await snap.createTransaction(parameter);
            return transaction.token; // Token ini dikirim ke frontend
        } catch (error) {
            console.error("Midtrans Error:", error);
            throw new Error("Gagal membuat transaksi pembayaran");
        }
    }
};