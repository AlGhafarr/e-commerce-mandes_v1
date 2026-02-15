import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { biteshipService } from '../services/biteship.services';
import midtransClient from 'midtrans-client';

// Interface untuk membantu TypeScript membaca kolom JSON 'shippingAddress'
interface ShippingAddressJson {
    recipient: string;
    phone: string;
    fullAddress: string;
    city: string;
    postalCode: string;
    district?: string;
}

const apiClient = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
});

export const midtransWebhook = async (req: Request, res: Response) => {
    try {
        const notification = req.body;
        
        // Cek status transaksi
        const statusResponse = await (apiClient as any).transaction.notification(notification);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Webhook Order ID: ${orderId} | Status: ${transactionStatus}`);

        // Mapping Status
        let newStatus = '';
        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') newStatus = 'PENDING_PAYMENT';
            else if (fraudStatus == 'accept') newStatus = 'PAID';
        } else if (transactionStatus == 'settlement') {
            newStatus = 'PAID';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            newStatus = 'CANCELLED';
        } else if (transactionStatus == 'pending') {
            newStatus = 'PENDING_PAYMENT';
        }

        // --- LOGIKA UTAMA ---
        if (newStatus === 'PAID') {
            
            // 2. Update Status & Ambil Data dengan Relasi yang BENAR
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID' }, // Schema Anda hanya pakai 'status', bukan 'paymentStatus'
                include: { 
                    items: { 
                        include: { 
                            // Sesuai Schema: OrderItem punya relasi ke Variant, Variant ke Product
                            variant: {
                                include: { product: true }
                            }
                        } 
                    } 
                }
            });

            // 3. Casting JSON Address agar bisa dibaca TypeScript
            const addressData = updatedOrder.shippingAddress as unknown as ShippingAddressJson;

            // 4. Validasi Data sebelum kirim ke Biteship
            if (addressData && updatedOrder.courier) {
                
                // Mapping Item untuk Payload Biteship
                const biteshipItems = updatedOrder.items.map((item) => {
                    // Fallback berat default 200g jika tidak ada data berat di DB
                    // Akses nama produk lewat relasi variant -> product
                    return {
                        name: item.productName || item.variant?.product?.name || "Snack",
                        description: item.variantName || "Varian Rasa",
                        value: item.price,
                        quantity: item.quantity,
                        weight: 200 
                    };
                });

                const shippingPayload = {
                    customerName: addressData.recipient,
                    customerPhone: addressData.phone,
                    // Gabungkan alamat dari JSON
                    addressFull: `${addressData.fullAddress}, ${addressData.district || ''}, ${addressData.city}, ${addressData.postalCode}`,
                    postalCode: parseInt(addressData.postalCode),
                    courierCode: updatedOrder.courier, // misal: "jne"
                    courierService: 'reg', 
                    
                    items: biteshipItems
                };

                console.log("Memproses Booking Biteship...");
                const shipment = await biteshipService.createOrder(shippingPayload);

                if (shipment && shipment.success) {
                    // Update Tracking ID (Resi)
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'SHIPPED',
                            trackingId: shipment.waybill_id 
                        }
                    });
                    console.log(`Biteship Success! Resi: ${shipment.waybill_id}`);
                } else {
                    console.error("Gagal Booking Biteship otomatis.");
                }
            } else {
                console.log("Data alamat (JSON) atau kurir tidak lengkap/kosong.");
            }

        } else if (newStatus === 'CANCELLED') {
             await prisma.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};