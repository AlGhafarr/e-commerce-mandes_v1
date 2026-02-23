import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import Routes
import productRoutes from './routes/product.route';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import cartRoutes from './routes/cart.route';
import orderRoutes from './routes/order.route';
import adminRoutes from './routes/admin.route';
import chatRoutes from './routes/chat.route';
import paymentRoutes from './routes/payment.route';

// Import Middlewares
import { apiLimiter } from './middleware/rateLimit.middleware';
import { authenticateToken } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ==============================================
// 1. TRUST PROXY (WAJIB UTK CLOUDFLARE/TUNNEL)
// ==============================================
// Agar Express percaya header X-Forwarded-Proto dari Cloudflare
app.set('trust proxy', true);

// ==============================================
// 2. CORS CONFIGURATION (STRICT & UNIFIED)
// ==============================================
const allowedOrigins = (() => {
  // Baca dari env ALLOWED_ORIGINS (comma-separated), contoh:
  // ALLOWED_ORIGINS=https://mandessnack.shop,https://api.mandessnack.shop
  const env = process.env.ALLOWED_ORIGINS;
  if (env && env.length) {
    return env.split(',').map(s => s.trim()).filter(Boolean);
  }

  const defaults = [
    'https://mandessnack.shop',
    'https://www.mandessnack.shop',
    'https://api.mandessnack.shop',
  ];

  // Untuk development, tambahkan localhost agar mudah dites tanpa env
  if (process.env.NODE_ENV !== 'production') {
    defaults.push('http://localhost:3000');
  }

  return defaults;
})();

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Izinkan request tanpa origin (misal dari server-to-server atau tools kayak Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`[CORS Blocked] Origin: ${origin}`); // Log biar tau siapa yang ditolak
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // WAJIB TRUE agar cookie dikirim/diterima
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// TERAPKAN CORS GLOBAL
app.use(cors(corsOptions));

// ---------------------------------------------------------------------------
// PERBAIKAN DISINI (BARIS ~66)
// Jangan pakai string '*' karena library path-to-regexp terbaru menganggapnya error.
// Gunakan Regex /.*/ agar diterima semua versi Express/Router.
// ---------------------------------------------------------------------------
app.options(/.*/, cors(corsOptions)); 

// ==============================================
// 3. PARSERS & GLOBAL MIDDLEWARES
// ==============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Rate Limiter Global
app.use(apiLimiter);

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[DEBUG PROTOCOL] ${req.method} ${req.url}`);
    console.log(`   - req.protocol: ${req.protocol}`);
    console.log(`   - req.secure: ${req.secure}`);
    console.log(`   - X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`);
    next();
});

// ==============================================
// 4. ROUTES
// ==============================================

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Mandes Backend API is Running!');
});

// ------------------------------------------
// A. PUBLIC ROUTES (Tanpa Auth Token)
// ------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);     // Login Admin ada disini
app.use('/api/products', productRoutes); // Katalog Produk
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

// ------------------------------------------
// B. AUTHENTICATION GATE (User Biasa)
// ------------------------------------------
// Semua route di bawah ini butuh Header Authorization / Cookie Token User
app.use(authenticateToken);

// ------------------------------------------
// C. PROTECTED ROUTES (User Biasa)
// ------------------------------------------
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// ==============================================
// 5. START SERVER
// ==============================================
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});