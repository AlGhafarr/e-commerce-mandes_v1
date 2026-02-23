import { Router } from 'express';
import { midtransWebhook, getMidtransConfig, biteshipWebhook } from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Manajemen Pembayaran (Midtrans Integration) dan Pengiriman (Biteship)
 */

/**
 * @swagger
 * /payment/config:
 *   get:
 *     summary: Dapatkan Konfigurasi Midtrans Client Key
 *     tags: [Payment]
 *     description: Endpoint untuk mendapatkan Client Key Midtrans yang diperlukan untuk inisialisasi Snap payment di frontend
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientKey:
 *                   type: string
 *                   example: "SB-Mid-client-xxxxxxxxxxxxx"
 *                   description: Midtrans Client Key untuk frontend
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to get config"
 */
router.get('/config', getMidtransConfig);

/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: Webhook Midtrans untuk notifikasi pembayaran
 *     tags: [Payment]
 *     description: Endpoint ini dipanggil otomatis oleh Midtrans saat status pembayaran berubah. TIDAK untuk diakses manual. Endpoint ini akan memverifikasi signature dan update status order di database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_status
 *               - order_id
 *               - transaction_id
 *               - gross_amount
 *               - signature_key
 *             properties:
 *               transaction_status:
 *                 type: string
 *                 enum: [capture, settlement, pending, deny, cancel, expire, failure]
 *                 description: Status transaksi dari Midtrans
 *                 example: "settlement"
 *               order_id:
 *                 type: string
 *                 description: ID order dari sistem Anda
 *                 example: "ORD-20260210-001"
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID dari Midtrans
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               gross_amount:
 *                 type: string
 *                 description: Total pembayaran dalam string
 *                 example: "150000.00"
 *               payment_type:
 *                 type: string
 *                 description: Metode pembayaran yang digunakan
 *                 example: "qris"
 *                 enum: [credit_card, bank_transfer, echannel, gopay, qris, cstore, akulaku]
 *               signature_key:
 *                 type: string
 *                 description: Signature untuk verifikasi authenticity
 *                 example: "abc123def456..."
 *               transaction_time:
 *                 type: string
 *                 format: date-time
 *                 description: Waktu transaksi
 *                 example: "2026-02-10 12:34:56"
 *               fraud_status:
 *                 type: string
 *                 enum: [accept, deny, challenge]
 *                 description: Status fraud detection
 *                 example: "accept"
 *     responses:
 *       200:
 *         description: Webhook berhasil diproses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Payment notification processed successfully"
 *       400:
 *         description: Invalid signature atau data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature key"
 *       404:
 *         description: Order tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/webhook', midtransWebhook);

/**
 * @swagger
 * /payment/biteship-webhook:
 *   post:
 *     summary: Webhook Biteship untuk notifikasi status pengiriman
 *     tags: [Payment]
 *     description: Endpoint ini dipanggil otomatis oleh Biteship saat status pengiriman berubah (pickup, on delivery, delivered, cancelled, dll). TIDAK untuk diakses manual. Endpoint ini akan update status tracking order di database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - status
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: ID order dari sistem Anda (bisa berbeda dengan tracking_id)
 *                 example: "ORD-20260210-001"
 *               tracking_id:
 *                 type: string
 *                 description: Tracking ID dari Biteship
 *                 example: "BITESHIP123456789"
 *               courier_tracking_id:
 *                 type: string
 *                 description: Nomor resi dari kurir (JNE, JNT, dll)
 *                 example: "JNE001234567890"
 *               status:
 *                 type: string
 *                 enum: [confirmed, allocated, picking_up, picked, dropping_off, delivered, cancelled, rejected, courier_not_found, returned]
 *                 description: |
 *                   Status pengiriman:
 *                   - **confirmed**: Order dikonfirmasi Biteship
 *                   - **allocated**: Driver sudah dialokasikan
 *                   - **picking_up**: Driver menuju lokasi pickup
 *                   - **picked**: Paket sudah dipickup
 *                   - **dropping_off**: Paket dalam perjalanan ke tujuan
 *                   - **delivered**: Paket sudah sampai
 *                   - **cancelled**: Pengiriman dibatalkan
 *                   - **rejected**: Pengiriman ditolak
 *                   - **courier_not_found**: Tidak ada driver tersedia
 *                   - **returned**: Paket dikembalikan
 *                 example: "delivered"
 *               courier_name:
 *                 type: string
 *                 description: Nama kurir (JNE, JNT, SiCepat, dll)
 *                 example: "jne"
 *                 enum: [jne, jnt, sicepat, grab, gojek, anteraja, ninja, idexpress, lion, paxel, gosend, sap]
 *               courier_type:
 *                 type: string
 *                 description: Tipe layanan kurir
 *                 example: "reg"
 *               courier_driver_name:
 *                 type: string
 *                 description: Nama driver (untuk instant delivery)
 *                 example: "Budi Santoso"
 *               courier_driver_phone:
 *                 type: string
 *                 description: Nomor telepon driver
 *                 example: "081234567890"
 *               courier_link:
 *                 type: string
 *                 description: Link tracking eksternal dari kurir
 *                 example: "https://jne.co.id/tracking/JNE001234567890"
 *               history:
 *                 type: array
 *                 description: Riwayat tracking pengiriman
 *                 items:
 *                   type: object
 *                   properties:
 *                     note:
 *                       type: string
 *                       example: "Paket diterima oleh [Budi]"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-10T15:30:00Z"
 *                     status:
 *                       type: string
 *                       example: "delivered"
 *               proof_of_delivery:
 *                 type: object
 *                 description: Bukti pengiriman (foto/signature)
 *                 properties:
 *                   photo_url:
 *                     type: string
 *                     example: "https://biteship.com/proof/12345.jpg"
 *                   signature_url:
 *                     type: string
 *                     example: "https://biteship.com/signature/12345.jpg"
 *                   received_by:
 *                     type: string
 *                     example: "Budi Santoso"
 *               delivery_time:
 *                 type: string
 *                 format: date-time
 *                 description: Waktu pengiriman (saat status delivered)
 *                 example: "2026-02-10T15:30:00Z"
 *     responses:
 *       200:
 *         description: Webhook berhasil diproses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Shipping status updated successfully"
 *       400:
 *         description: Data webhook tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid webhook data"
 *       404:
 *         description: Order tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/biteship-webhook', biteshipWebhook);

export default router;