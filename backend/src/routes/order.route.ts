import { Router } from 'express';
import { createOrder, getAllOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manajemen Pesanan (Order)
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Buat pesanan baru (Checkout)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - addressId
 *               - totalAmount
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     variant:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *               addressId:
 *                 type: string
 *               courier:
 *                 type: string
 *               shippingCost:
 *                 type: number
 *               totalAmount:
 *                 type: number
 *               voucherCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order berhasil dibuat, return snap token Midtrans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderId:
 *                   type: string
 *                 snap_token:
 *                   type: string
 *                 snap_url:
 *                   type: string
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized - Belum login
 */
router.post('/', authenticateToken, createOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Ambil semua pesanan (untuk Admin Dashboard)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List semua pesanan
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   customer:
 *                     type: string
 *                   total:
 *                     type: number
 *                   status:
 *                     type: string
 *                   date:
 *                     type: string
 *                   courier:
 *                     type: string
 *                   trackingId:
 *                     type: string
 *                   items:
 *                     type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getAllOrders);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update status pesanan (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING_PAYMENT, PAID, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *     responses:
 *       200:
 *         description: Status berhasil diupdate
 *       400:
 *         description: Status tidak valid
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order tidak ditemukan
 */
router.put('/:id/status', authenticateToken, updateOrderStatus);

export default router;