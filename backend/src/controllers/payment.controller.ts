import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { biteshipService } from '../services/biteship.services';
import midtransClient from 'midtrans-client';

// Interface untuk membantu TypeScript membaca kolom JSON 'shippingAddress'
interface ShippingAddressType {
    recipient: string;
    phone: string;
    fullAddress: string;
    city: string;
    postalCode: string;
    district?: string;
}

// Inisialisasi Midtrans dengan Fallback string kosong agar tidak error TS
const apiClient = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || "", 
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ""
});

export const midtransWebhook = async (req: Request, res: Response) => {
    try {
        const notification = req.body;
        
        // 1. Cek Status Transaksi dari Midtrans
        // Gunakan (as any) karena type definition midtrans terkadang tidak lengkap
        const statusResponse = await (apiClient as any).transaction.notification(notification);
        
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Webhook Order ID: ${orderId} | Status: ${transactionStatus}`);

        // 2. Mapping Status Midtrans ke Schema Database Anda
        let newStatus = '';
        
        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') newStatus = 'PENDING_PAYMENT'; // Atau buat status CHALLENGE jika ada di Enum
            else if (fraudStatus == 'accept') newStatus = 'PAID';
        } else if (transactionStatus == 'settlement') {
            newStatus = 'PAID';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            newStatus = 'CANCELLED';
        } else if (transactionStatus == 'pending') {
            newStatus = 'PENDING_PAYMENT';
        }

        // 3. Logika Utama
        if (newStatus === 'PAID') {
            // A. Update Status Order jadi PAID dulu
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID' },
                include: { 
                    // Perbaikan Relasi sesuai Schema: OrderItem -> Variant -> Product
                    items: { 
                        include: { 
                            variant: { 
                                include: { product: true } 
                            } 
                        } 
                    } 
                }
            });

            // B. Persiapan Data untuk Biteship
            // Casting JSON shippingAddress ke Interface agar bisa dibaca TS
            const addressData = updatedOrder.shippingAddress as unknown as ShippingAddressType;

            // Validasi kelengkapan data sebelum panggil kurir
            if (addressData && updatedOrder.courier) {
                
                // Format Item untuk Biteship
                const biteshipItems = updatedOrder.items.map((item) => ({
                    name: item.productName, // Ambil dari snapshot orderItem
                    description: item.variantName,
                    value: item.price,
                    quantity: item.quantity,
                    weight: 200 // Default 200g, atau ambil dari item.variant.product.weight jika nanti ada kolom berat
                }));

                const shippingPayload = {
                    customerName: addressData.recipient,
                    customerPhone: addressData.phone,
                    addressFull: `${addressData.fullAddress}, ${addressData.district}, ${addressData.city}, ${addressData.postalCode}`,
                    postalCode: parseInt(addressData.postalCode),
                    courierCode: updatedOrder.courier, // misal: "jne"
                    courierService: 'reg', // Default ke 'reg' karena kolom courierService belum ada di schema Order
                    items: biteshipItems
                };

                console.log("Memproses Booking Biteship...");
                const shipment = await biteshipService.createOrder(shippingPayload);

                if (shipment && shipment.success) {
                    // C. Jika Booking Sukses, Simpan Resi (Tracking ID) dan Update Status
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'SHIPPED',
                            trackingId: shipment.waybill_id // Sesuai schema: trackingId
                        }
                    });
                    console.log(`Biteship Success! Resi: ${shipment.waybill_id}`);
                } else {
                    console.error("Gagal Booking Biteship otomatis.");
                }
            } else {
                console.log("Data alamat atau kurir tidak lengkap, skip booking biteship.");
            }

        } else if (newStatus === 'CANCELLED') {
             await prisma.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });
        }

        // Return 200 OK agar Midtrans tidak mengirim ulang notifikasi
        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};