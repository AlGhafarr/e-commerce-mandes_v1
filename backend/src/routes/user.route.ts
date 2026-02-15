import { Router } from 'express';
import { getAddresses, addAddress, getMyOrders, getAllCustomers } from '../controllers/user.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Manajemen Data User
 */

/**
 * @swagger
 * /user/addresses:
 *   get:
 *     summary: Ambil semua alamat user yang sedang login
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List alamat user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   label:
 *                     type: string
 *                   recipient:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   fullAddress:
 *                     type: string
 *                   village:
 *                     type: string
 *                   district:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - Belum login
 */
router.get('/addresses', authenticateToken, getAddresses);

/**
 * @swagger
 * /user/addresses:
 *   post:
 *     summary: Tambah alamat baru
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - phone
 *               - fullAddress
 *               - city
 *             properties:
 *               label:
 *                 type: string
 *                 example: Rumah
 *               recipient:
 *                 type: string
 *               phone:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               village:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Alamat berhasil ditambahkan
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Unauthorized
 */
router.post('/addresses', authenticateToken, addAddress);

/**
 * @swagger
 * /user/orders:
 *   get:
 *     summary: Ambil riwayat pesanan user yang sedang login
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List pesanan user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   totalAmount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   items:
 *                     type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/orders', authenticateToken, getMyOrders);

/**
 * @swagger
 * /user/customers:
 *   get:
 *     summary: Ambil semua customer (Admin only)
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List semua customer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   role:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Bukan admin
 */
router.get('/customers', requireAdmin, getAllCustomers);

export default router;