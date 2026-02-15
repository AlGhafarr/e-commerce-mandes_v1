import { Router } from 'express';
import { 
  registerRequest, 
  verifyOtp, 
  setPassword, 
  login, 
  getMe, 
  logout,
  loginWithPhone 
} from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Manajemen Autentikasi (User & Admin)
 */

// --- USER AUTHENTICATION ---

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Tahap 1 - Request Registrasi (Kirim OTP WhatsApp)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim ke WhatsApp
 *       400:
 *         description: Username/Email/Phone sudah terdaftar
 */
router.post('/register', authLimiter, registerRequest);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Tahap 2 - Verifikasi OTP (Register atau Login)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - otp
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username atau Nomor HP
 *                 example: "johndoe"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP Valid - Login sukses atau perlu set password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 action:
 *                   type: string
 *                   enum: [LOGIN_SUCCESS, SET_PASSWORD]
 *                 username:
 *                   type: string
 *       400:
 *         description: OTP Salah atau Kadaluarsa
 */
router.post('/verify-otp', authLimiter, verifyOtp);

/**
 * @swagger
 * /auth/set-password:
 *   post:
 *     summary: Tahap 3 - Set Password (Finalisasi Register)
 *     tags: [Auth]
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
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Akun berhasil dibuat, user otomatis login
 */
router.post('/set-password', setPassword);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login User (Username/Email + Password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Bisa Email atau Username
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login berhasil (Set Cookie)
 *       401:
 *         description: Password salah
 *       404:
 *         description: User tidak ditemukan
 */
router.post('/login', authLimiter, login);

// --- LOGIN VIA WHATSAPP OTP ---

/**
 * @swagger
 * /auth/login-phone:
 *   post:
 *     summary: Login via WhatsApp OTP (Tanpa Password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *     responses:
 *       200:
 *         description: OTP dikirim ke WhatsApp
 *       500:
 *         description: Gagal mengirim OTP
 */
router.post('/login-phone', authLimiter, loginWithPhone);

// --- USER PROFILE ---

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Cek Profile User yang sedang login
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data User ditemukan
 *       401:
 *         description: Belum login / Token expired
 */
router.get('/me', getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout User
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Berhasil logout (Cookie dihapus)
 */
router.post('/logout', logout);

export default router;