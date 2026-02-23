import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { biteshipService } from '../services/biteship.services';
import midtransClient from 'midtrans-client';

interface ShippingAddressType {
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

// ✅ 1. API BARU: Kirim Config ke Frontend
export const getMidtransConfig = (req: Request, res: Response) => {
    res.json({
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    });
};

// ==========================================
// Webhook Midtrans (Sama seperti punya Anda)
// ==========================================
export const midtransWebhook = async (req: Request, res: Response) => {
    try {
        const notification = req.body;
        
        const statusResponse = await (apiClient as any).transaction.notification(notification);
        
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Webhook Order ID: ${orderId} | Status: ${transactionStatus}`);

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

        if (newStatus === 'PAID') {
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID' },
                include: { 
                    items: { 
                        include: { 
                            variant: { 
                                include: { product: true } 
                            } 
                        } 
                    } 
                }
            });

            const addressData = updatedOrder.shippingAddress as unknown as ShippingAddressType;

            if (addressData && updatedOrder.courier) {
                const biteshipItems = updatedOrder.items.map((item) => ({
                    name: item.productName, 
                    description: item.variantName,
                    value: item.price,
                    quantity: item.quantity,
                    weight: 200 
                }));

                const shippingPayload = {
                    customerName: addressData.recipient,
                    customerPhone: addressData.phone,
                    addressFull: `${addressData.fullAddress}, ${addressData.district}, ${addressData.city}, ${addressData.postalCode}`,
                    postalCode: parseInt(addressData.postalCode),
                    courierCode: updatedOrder.courier, 
                    courierService: 'reg', 
                    items: biteshipItems
                };

                console.log("Memproses Booking Biteship...");
                const shipment = await biteshipService.createOrder(shippingPayload);

                if (shipment && shipment.success) {
                const biteshipOrderId = shipment.id; 
                    const waybillId = shipment.courier?.waybill_id || shipment.courier?.tracking_id || 'Menunggu Kurir';

                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: 'SHIPPED',
                            trackingId: biteshipOrderId, // Masuk ke kolom trackingId (ID Biteship)
                            resiNumber: waybillId        // Masuk ke kolom resiNumber (Resi Asli)
                        }
                    });
                    console.log(`✅ Biteship Success! ID: ${biteshipOrderId} | Resi: ${waybillId}`);
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

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==========================================
// Webhook Biteship (Update Resi & Status Pengiriman)
// ==========================================
export const biteshipWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log(`📦 Webhook Biteship Masuk | Event: ${payload.event} | Status: ${payload.status}`);

        if (payload.event === 'order.status' || payload.order_id) {
            const trackingId = payload.order_id;
            const resiBaru = payload.courier?.waybill_id;
            const statusKurir = payload.status; 
            const trackingHistory = payload.courier?.history; // ✅ Ambil riwayat transit gudang dari Biteship

            let updateData: any = {};

            if (resiBaru) updateData.resiNumber = resiBaru;
            
            // ✅ Simpan riwayat lokasi transit ke database
            if (trackingHistory && trackingHistory.length > 0) {
                updateData.trackingHistory = trackingHistory;
            }

            if (statusKurir === 'delivered') updateData.status = 'DELIVERED';

            if (Object.keys(updateData).length > 0) {
                await prisma.order.update({
                    where: { trackingId: trackingId },
                    data: updateData
                });
                console.log(`✅ Pesanan di-update oleh Biteship: TrackingID ${trackingId}`);
            }
        }
        res.status(200).json({ message: "Webhook Biteship OK" });
    } catch (error) {
        console.error("🚨 Webhook Biteship Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};