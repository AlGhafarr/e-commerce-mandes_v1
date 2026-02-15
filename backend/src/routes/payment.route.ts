import { Router } from 'express';
import { midtransWebhook } from '../controllers/payment.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Manajemen Pembayaran (Midtrans Integration)
 */

/**
 * @swagger
 * /payment/webhook:
 *   post:
 *     summary: Webhook Midtrans untuk notifikasi pembayaran
 *     tags: [Payment]
 *     description: Endpoint ini dipanggil otomatis oleh Midtrans saat status pembayaran berubah. TIDAK untuk diakses manual.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_status:
 *                 type: string
 *                 enum: [capture, settlement, pending, deny, cancel, expire, failure]
 *               order_id:
 *                 type: string
 *               transaction_id:
 *                 type: string
 *               gross_amount:
 *                 type: string
 *               payment_type:
 *                 type: string
 *               signature_key:
 *                 type: string
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
 *                   example: success
 *       400:
 *         description: Invalid signature atau data tidak valid
 */
router.post('/webhook', midtransWebhook);

export default router;