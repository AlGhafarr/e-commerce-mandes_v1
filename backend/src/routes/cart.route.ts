import { Router } from 'express';
import { getCart, addToCart, updateCartQuantity, deleteCartItem } from '../controllers/cart.controller'; 
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Manajemen Keranjang Belanja
 */

// Middleware Auth wajib untuk semua route cart
router.use(authenticateToken);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Ambil data keranjang user yang sedang login
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data keranjang berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       productId:
 *                         type: string
 *                       variantId:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *       401:
 *         description: Unauthorized - Belum login
 */
router.get('/', getCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Tambah item baru ke keranjang
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item berhasil ditambahkan ke keranjang
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized
 */
router.post('/', addToCart);

/**
 * @swagger
 * /cart/sync:
 *   post:
 *     summary: Update quantity item di keranjang
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItemId
 *               - quantity
 *             properties:
 *               cartItemId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Quantity berhasil diupdate
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item tidak ditemukan
 */
router.post('/sync', updateCartQuantity);

/**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     summary: Hapus item dari keranjang
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cart item yang akan dihapus
 *     responses:
 *       200:
 *         description: Item berhasil dihapus
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item tidak ditemukan
 */
router.delete('/:id', deleteCartItem);

export default router;