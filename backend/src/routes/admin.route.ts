import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminLogin, adminLogout, adminMe, getCustomers, getAdminOrders, updateAdminOrderStatus } from '../controllers/admin.controller';


const router = Router();
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'rahasia_admin_ganteng';
/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoint khusus Admin Dashboard
 */

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES — tidak perlu auth
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login admin dengan username & password dari .env
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: super_admin_mandes
 *               password:
 *                 type: string
 *                 example: hG0$yW3(uS6)mC9
 *     responses:
 *       200:
 *         description: Login berhasil, cookie mandes_admin_token di-set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 username:
 *                   type: string
 *       400:
 *         description: Username / password kosong
 *       401:
 *         description: Kredensial salah
 */
router.post('/login', adminLogin);

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: Logout admin (clear cookie)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Logout berhasil
 */
router.post('/logout', adminLogout);

/**
 * @swagger
 * /admin/me:
 *   get:
 *     summary: Cek status login admin (dipakai frontend saat mount)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data admin yang sedang login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Belum login atau token expired
 */
router.get('/me', adminMe);

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES — wajib auth (struktur lama tetap sama)
// ─────────────────────────────────────────────────────────────

// Middleware Auth wajib untuk semua route di bawah ini
const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
    // Ambil token dari cookie admin, BUKAN cookie user
    const token = req.cookies.mandes_admin_token;

    if (!token) {
        // Cek header juga untuk backup (kalau testing di Postman tanpa cookie)
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: "Akses Ditolak: Tidak ada token admin" });
    }

    try {
        // Verifikasi Token pakai Secret Admin
        const decoded = jwt.verify(token, ADMIN_SECRET);
        (req as any).admin = decoded; // Tempel data admin ke request
        next(); // Lanjut masuk
    } catch (error) {
        return res.status(401).json({ error: "Token Admin Tidak Valid / Kadaluarsa" });
    }
};


router.use(verifyAdminToken);

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Ambil semua data customer (Admin only)
 *     tags: [Admin]
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
 *                   isVerified:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Unauthorized - Belum login
 *       403:
 *         description: Forbidden - Bukan admin
 */
router.get('/customers', getCustomers);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Ambil semua pesanan untuk Admin Dashboard
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_PAYMENT, PAID, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
 *         description: Filter berdasarkan status pesanan
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman (pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
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
 *       403:
 *         description: Forbidden - Bukan admin
 */
router.get('/orders', getAdminOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Update status pesanan (Admin only)
 *     tags: [Admin]
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
 *               trackingId:
 *                 type: string
 *                 description: Nomor resi (opsional, untuk status SHIPPED)
 *     responses:
 *       200:
 *         description: Status pesanan berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *       400:
 *         description: Status tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Bukan admin
 *       404:
 *         description: Order tidak ditemukan
 */
router.patch('/orders/:id/status', updateAdminOrderStatus);

export default router;