import { Router } from 'express';
import { getAllProducts, createProduct, deleteProduct, getProductById, updateProduct } from '../controllers/product.controller';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Manajemen Produk
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Ambil semua produk (Public)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter berdasarkan kategori
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari produk berdasarkan nama
 *     responses:
 *       200:
 *         description: List semua produk
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
 *                   description:
 *                     type: string
 *                   basePrice:
 *                     type: number
 *                   category:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   stock:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *                   variants:
 *                     type: array
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Ambil detail produk berdasarkan ID (Public)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Detail produk
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 basePrice:
 *                   type: number
 *                 category:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 stock:
 *                   type: integer
 *                 variants:
 *                   type: array
 *       404:
 *         description: Produk tidak ditemukan
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Buat produk baru (Admin only)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - basePrice
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               stock:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isPreorder:
 *                 type: boolean
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     size:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Bukan admin
 */
router.post('/', requireAdmin, createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update produk (Admin only)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               stock:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Bukan admin
 *       404:
 *         description: Produk tidak ditemukan
 */
router.put('/:id', requireAdmin, updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Hapus produk (Admin only)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Produk berhasil dihapus
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Bukan admin
 *       404:
 *         description: Produk tidak ditemukan
 */
router.delete('/:id', requireAdmin, deleteProduct);

export default router;